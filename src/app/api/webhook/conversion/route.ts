import { NextRequest, NextResponse } from 'next/server';
import { db, prisma } from '@/lib/prisma';
import crypto from 'crypto';
import {
  resolveConversionEventContract,
  resolveWebhookConversionExternalIds,
} from '@/lib/conversion-idempotency';
import { logSystemAuditAction } from '@/lib/audit';

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readOptionalString(
  source: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return null;
}

// ─── Webhook Signature Verification ────────────────────────────
function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch (_e) {
    return false;
  }
}

async function verifyApiKey(request: NextRequest): Promise<{ valid: boolean; userId: string | null }> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) return { valid: false, userId: null };

  // Hash the incoming key and look up by keyHash for secure comparison
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const key = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true }
  }).catch(() => null);

  return { valid: !!key, userId: key?.userId || null };
}

export async function POST(request: NextRequest) {
  try {
    // ─── Authentication: Require API key OR webhook signature ───
    const rawBody = await request.text();
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-refferq-signature');

    let authenticated = false;
    let authActorUserId: string | null = null;

    // Method 1: API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      const apiAuth = await verifyApiKey(request);
      authenticated = apiAuth.valid;
      authActorUserId = apiAuth.userId;
    }

    // Method 2: Webhook signature verification
    if (!authenticated && webhookSecret && signature) {
      authenticated = verifyWebhookSignature(rawBody, signature, webhookSecret);
    }

    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Valid API key or webhook signature required' },
        { status: 401 }
      );
    }

    const body = toObject(JSON.parse(rawBody));
    const eventType = readOptionalString(body, 'event_type', 'eventType');
    const currency = readOptionalString(body, 'currency') || 'USD';
    const customerEmail = readOptionalString(body, 'customer_email', 'customerEmail');
    const attributionKey = readOptionalString(body, 'attribution_key', 'attributionKey');
    const referralCode = readOptionalString(body, 'referral_code', 'referralCode');
    const eventMetadata = toObject(body.event_metadata ?? body.eventMetadata);
    const amountCents =
      typeof body.amount_cents === 'number'
        ? Math.round(body.amount_cents)
        : typeof body.amountCents === 'number'
          ? Math.round(body.amountCents)
          : 0;
    const eventContract = resolveConversionEventContract({
      eventId: body.event_id ?? body.eventId,
      orderId: body.order_id ?? body.orderId,
      occurredAt: body.occurred_at ?? body.occurredAt,
      timestamp: body.timestamp,
      eventMetadata,
    });

    // Validate required fields
    if (!eventType || !customerEmail) {
      return NextResponse.json(
        { success: false, message: 'Event type and customer email are required' },
        { status: 400 }
      );
    }

    const normalizedEventType = String(eventType).toUpperCase();
    const allowedEventTypes = new Set(['SIGNUP', 'PURCHASE', 'TRIAL', 'LEAD']);
    if (!allowedEventTypes.has(normalizedEventType)) {
      await logSystemAuditAction({
        preferredActorId: authActorUserId,
        action: 'conversion_rejected',
        objectType: 'conversion_event',
        objectId: eventContract.eventId || eventContract.orderId || `rejected_${Date.now()}`,
        payload: {
          reason: 'invalid_event_type',
          eventType: normalizedEventType,
          customerEmail,
          occurredAt: eventContract.occurredAt,
        },
      });

      return NextResponse.json(
        { success: false, message: `Invalid event type: ${eventType}` },
        { status: 400 }
      );
    }

    // Idempotency guard: do not process the same external event/order twice
    const { externalEventId, externalOrderId } = resolveWebhookConversionExternalIds({
      eventId: eventContract.eventId,
      orderId: eventContract.orderId,
      eventMetadata,
    });
    if (externalEventId || externalOrderId) {
      const duplicate = await prisma.conversion.findFirst({
        where: {
          OR: [
            ...(externalEventId ? [{
              eventMetadata: {
                path: ['externalEventId'],
                equals: String(externalEventId),
              },
            }, {
              eventMetadata: {
                path: ['event_id'],
                equals: String(externalEventId),
              },
            }] : []),
            ...(externalOrderId ? [{
              eventMetadata: {
                path: ['orderId'],
                equals: String(externalOrderId),
              },
            }, {
              eventMetadata: {
                path: ['order_id'],
                equals: String(externalOrderId),
              },
            }] : []),
          ],
        },
        include: {
          commissions: true,
          affiliate: {
            select: { userId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (duplicate) {
        await logSystemAuditAction({
          preferredActorId: authActorUserId || duplicate.affiliate.userId,
          action: 'conversion_duplicate',
          objectType: 'conversion_event',
          objectId: externalEventId || externalOrderId || duplicate.id,
          payload: {
            source: 'webhook_conversion',
            externalEventId,
            externalOrderId,
            occurredAt: eventContract.occurredAt,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Duplicate conversion event ignored',
          duplicate: true,
          conversion: duplicate,
          commission: duplicate.commissions[0] || null,
        });
      }
    }

    let affiliate = null;
    let attributionMethod = 'none';

    // Try to find affiliate through attribution key first
    if (attributionKey) {
      const click = await prisma.referralClick.findFirst({
        where: {
          metadata: {
            path: ['attribution_key'],
            equals: String(attributionKey),
          },
        },
        include: {
          referral: {
            include: {
              affiliate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (click?.referral?.affiliate) {
        affiliate = click.referral.affiliate;
        attributionMethod = 'attribution_key';
      }
    }

    // Fallback to referral code
    if (!affiliate && referralCode) {
      affiliate = await db.getAffiliateByReferralCode(referralCode);
      attributionMethod = 'referral_code';
    }

    // If no affiliate found, log the conversion but don't create commission
    if (!affiliate) {
      console.log('Conversion received but no affiliate attribution found:', {
        eventType,
        customerEmail,
        attributionKey,
        referralCode,
      });

      await logSystemAuditAction({
        preferredActorId: authActorUserId,
        action: 'conversion_unattributed',
        objectType: 'conversion_event',
        objectId: externalEventId || externalOrderId || `unattributed_${Date.now()}`,
        payload: {
          source: 'webhook_conversion',
          eventType: normalizedEventType,
          customerEmail,
          attributionKey,
          referralCode,
          occurredAt: eventContract.occurredAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Conversion logged (no attribution)',
        attributed: false,
      });
    }

    // Create conversion record
    const conversion = await db.createConversion({
      affiliateId: affiliate.id,
      eventType: normalizedEventType as 'SIGNUP' | 'PURCHASE' | 'TRIAL' | 'LEAD',
      amountCents,
      currency,
      eventMetadata: {
        ...eventMetadata,
        event_id: externalEventId || null,
        order_id: externalOrderId || null,
        occurred_at: eventContract.occurredAt,
        eventId: externalEventId || null,
        orderId: externalOrderId || null,
        occurredAt: eventContract.occurredAt,
        customerEmail,
        externalEventId: externalEventId || null,
        externalOrderId: externalOrderId || null,
        attributionMethod,
        attributionKey,
        referralCode,
      },
    });

    // Calculate commission
    const commissionRules = await db.getCommissionRules();
    const applicableRule = commissionRules.find((rule) => rule.isDefault);

    const commissionRate = applicableRule?.value || 15;
    let commissionAmount = 0;

    if (applicableRule?.type === 'PERCENTAGE' && amountCents > 0) {
      commissionAmount = Math.floor((amountCents * commissionRate) / 100);
    } else if (applicableRule?.type === 'FIXED') {
      commissionAmount = commissionRate;
    }

    // ─── Commission Hold Period ─────────────────────────────────
    // Fetch hold days from ProgramSettings (default 30)
    const settings = await prisma.programSettings.findFirst({
      select: { commissionHoldDays: true },
    });
    const holdDays = settings?.commissionHoldDays ?? 30;
    const maturesAt = new Date();
    maturesAt.setDate(maturesAt.getDate() + holdDays);

    // Create commission record with maturesAt (status stays PENDING until maturation)
    const commission = await prisma.commission.create({
      data: {
        conversionId: conversion.id,
        affiliateId: affiliate.id,
        userId: affiliate.userId,
        amountCents: commissionAmount,
        rate: commissionRate,
        status: 'PENDING',
        maturesAt,
      },
    });

    // NOTE: We do NOT update balanceCents here anymore.
    // Balance is only updated when the commission matures (PENDING → APPROVED).
    // This protects against refunds during the hold period.

    // Log audit event
    await db.createAuditLog({
      actorId: authActorUserId || affiliate.userId,
      action: 'conversion_tracked',
      objectType: 'conversion',
      objectId: conversion.id,
      payload: {
        event_type: normalizedEventType,
        amount_cents: amountCents,
        commission_amount: commissionAmount,
        affiliate_id: affiliate.id,
        attributionMethod,
        authActorUserId,
        event_id: externalEventId,
        order_id: externalOrderId,
        occurred_at: eventContract.occurredAt,
      },
    });

    await logSystemAuditAction({
      preferredActorId: authActorUserId || affiliate.userId,
      action: 'conversion_attributed',
      objectType: 'conversion',
      objectId: conversion.id,
      payload: {
        source: 'webhook_conversion',
        eventType: normalizedEventType,
        eventId: externalEventId,
        orderId: externalOrderId,
        occurredAt: eventContract.occurredAt,
        attributionMethod,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Conversion tracked successfully',
      attributed: true,
      conversion,
      commission,
      attributionMethod,
    });
  } catch (error) {
    console.error('Conversion webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process conversion' },
      { status: 500 }
    );
  }
}
