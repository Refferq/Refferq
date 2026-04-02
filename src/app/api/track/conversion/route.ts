import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { validateTrackingApiKey } from '@/lib/tracking-auth';
import { buildTrackingCorsHeaders } from '@/lib/tracking-cors';
import {
  resolveConversionEventContract,
  resolveTrackConversionIdempotency,
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

/**
 * POST /api/track/conversion - Track conversions/sales
 */
export async function POST(req: NextRequest) {
  const withCors = (response: NextResponse) => {
    const corsHeaders = buildTrackingCorsHeaders(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };

  try {
    const keyValidation = await validateTrackingApiKey(req, { requireWriteScope: true });
    if (!keyValidation.valid) {
      return withCors(NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 401 }
      ));
    }

    const body = toObject(await req.json());
    const referralCode = readOptionalString(body, 'referralCode', 'referral_code');
    const customerEmail = readOptionalString(body, 'customerEmail', 'customer_email');
    const customerName = readOptionalString(body, 'customerName', 'customer_name');
    const currency = readOptionalString(body, 'currency');
    const idempotencyKey = readOptionalString(body, 'idempotencyKey', 'idempotency_key');
    const url = readOptionalString(body, 'url');
    const metadata = toObject(body.metadata ?? body.event_metadata);
    const metadataJson = metadata as unknown as Prisma.InputJsonObject;
    const settings = await prisma.programSettings.findFirst({
      select: { currency: true },
    });
    const defaultCurrency = settings?.currency || 'RUB';

    const amountRaw =
      typeof body.amount === 'number'
        ? body.amount
        : typeof body.amount_cents === 'number'
          ? body.amount_cents / 100
          : NaN;

    const eventContract = resolveConversionEventContract({
      eventId: body.eventId ?? body.event_id,
      orderId: body.orderId ?? body.order_id,
      occurredAt: body.occurredAt ?? body.occurred_at,
      timestamp: body.timestamp,
      eventMetadata: metadata,
    });

    if (!referralCode) {
      return withCors(NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      ));
    }

    if (typeof amountRaw !== 'number' || Number.isNaN(amountRaw) || amountRaw <= 0) {
      return withCors(NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      ));
    }

    // Find affiliate by referral code
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!affiliate) {
      return withCors(NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 404 }
      ));
    }

    if (affiliate.user.status !== 'ACTIVE') {
      return withCors(NextResponse.json(
        { success: false, error: 'Affiliate is not active' },
        { status: 403 }
      ));
    }

    // Check if referral with this email already exists
    let referral;
    if (customerEmail) {
      referral = await prisma.referral.findFirst({
        where: {
          leadEmail: customerEmail,
          affiliateId: affiliate.id,
        },
      });
    }

    // Create referral if doesn't exist
    if (!referral && customerEmail) {
      referral = await prisma.referral.create({
        data: {
          leadEmail: customerEmail,
          leadName: customerName || 'Unknown Customer',
          affiliateId: affiliate.id,
          status: 'APPROVED',
          metadata: metadataJson,
        },
      });
    } else if (referral && referral.status === 'PENDING') {
      // Update referral status to APPROVED
      referral = await prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'APPROVED',
          metadata: {
            ...(referral.metadata as Prisma.InputJsonObject),
            ...metadataJson,
          } as Prisma.InputJsonObject,
        },
      });
    }

    // Idempotency guard (orderId preferred, fallback to Idempotency-Key header/body)
    const { orderId: normalizedOrderId, idempotencyKey: requestIdempotencyKey } = resolveTrackConversionIdempotency({
      orderId: eventContract.orderId,
      bodyIdempotencyKey: idempotencyKey,
      headerIdempotencyKey: req.headers.get('idempotency-key'),
    });

    if (normalizedOrderId || requestIdempotencyKey) {
      const existingConversion = await prisma.conversion.findFirst({
        where: {
          affiliateId: affiliate.id,
          OR: [
            ...(normalizedOrderId ? [{
              eventMetadata: {
                path: ['orderId'],
                equals: normalizedOrderId,
              },
            }, {
              eventMetadata: {
                path: ['order_id'],
                equals: normalizedOrderId,
              },
            }] : []),
            ...(requestIdempotencyKey ? [{
              eventMetadata: {
                path: ['idempotencyKey'],
                equals: requestIdempotencyKey,
              },
            }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingConversion) {
        await logSystemAuditAction({
          preferredActorId: keyValidation.userId,
          action: 'conversion_duplicate',
          objectType: 'conversion_event',
          objectId: normalizedOrderId || requestIdempotencyKey || existingConversion.id,
          payload: {
            source: 'track_conversion',
            referralCode,
            eventId: eventContract.eventId,
            orderId: normalizedOrderId,
            occurredAt: eventContract.occurredAt,
          },
        });

        const response = NextResponse.json({
          success: true,
          message: 'Conversion already tracked',
          idempotent: true,
          conversion: {
            id: existingConversion.id,
            amount: existingConversion.amountCents / 100,
            currency: existingConversion.currency,
          },
        });

        return withCors(response);
      }
    }

    // Create conversion record
    const amountCents = Math.round(amountRaw * 100);

    const conversion = await prisma.conversion.create({
      data: {
        affiliateId: affiliate.id,
        referralId: referral?.id || null,
        eventType: 'PURCHASE',
        amountCents,
        currency: currency || defaultCurrency,
        status: 'PENDING',
        eventMetadata: {
          eventId: eventContract.eventId,
          event_id: eventContract.eventId,
          orderId: normalizedOrderId,
          order_id: normalizedOrderId,
          occurredAt: eventContract.occurredAt,
          occurred_at: eventContract.occurredAt,
          idempotencyKey: requestIdempotencyKey || null,
          url: url || null,
          timestamp: eventContract.occurredAt,
          keySource: keyValidation.source,
          ...metadataJson,
        } as Prisma.InputJsonObject,
      },
    });

    await logSystemAuditAction({
      preferredActorId: keyValidation.userId || affiliate.user.id,
      action: 'conversion_attributed',
      objectType: 'conversion',
      objectId: conversion.id,
      payload: {
        source: 'track_conversion',
        referralCode,
        eventId: eventContract.eventId,
        orderId: normalizedOrderId,
        occurredAt: eventContract.occurredAt,
      },
    });

    // Note: Commission calculation will be done by the commission rules system
    // This just creates the conversion record

    console.log('✅ Conversion tracked successfully:', {
      conversionId: conversion.id,
      affiliateId: affiliate.id,
      referralId: referral?.id,
      amount: amountCents / 100,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Conversion tracked successfully',
      conversion: {
        id: conversion.id,
        amount: amountCents / 100,
        currency: conversion.currency,
      },
      affiliate: {
        name: affiliate.user.name,
        code: affiliate.referralCode,
      },
    });

    withCors(response);
    if (keyValidation.source === 'integration_settings') {
      response.headers.set('X-Refferq-Key-Mode', 'legacy-public-key');
    }
    return response;
  } catch (error) {
    console.error('POST /api/track/conversion error:', error);
    return withCors(NextResponse.json(
      { success: false, error: 'Failed to track conversion' },
      { status: 500 }
    ));
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, {
    status: 200,
    headers: buildTrackingCorsHeaders(req),
  });
}
