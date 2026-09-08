import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { db, prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

async function verifyApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) return false;

  // Hash the incoming key and look up by keyHash for secure comparison
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const key = await prisma.apiKey.findFirst({
    where: { keyHash, isActive: true }
  }).catch(() => null);

  return !!key;
}

 async function POSTHandler(request: NextRequest) {
  try {
    // ─── Authentication: Require API key OR webhook signature ───
    const rawBody = await request.text();
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-refferq-signature');

    let authenticated = false;

    // Method 1: API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      authenticated = await verifyApiKey(request);
    }

    // Method 2: Webhook signature verification
    if (!authenticated && webhookSecret && signature) {
      authenticated = verifyWebhookSignature(rawBody, signature, webhookSecret);
    }

    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: __tr("Unauthorized: Valid API key or webhook signature required") },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);
    const {
      event_type,
      amount_cents,
      currency = 'USD',
      customer_email,
      attribution_key,
      referral_code,
      event_metadata = {},
    } = body;

    // Validate required fields
    if (!event_type || !customer_email) {
      return NextResponse.json(
        { success: false, message: __tr("Event type and customer email are required") },
        { status: 400 }
      );
    }

    let affiliate = null;
    let attributionMethod = 'none';

    // Try to find affiliate through attribution key first
    if (attribution_key) {
      // In a real implementation, this would be stored in Redis
      // For this simulation, we'll comment out the problematic call
      // const recentClicks = await db.getClicksByReferralId('some-referral-id');
      // For demo purposes, we'll use referral_code method
      attributionMethod = 'attribution_key';
    }

    // Fallback to referral code
    if (!affiliate && referral_code) {
      affiliate = await db.getAffiliateByReferralCode(referral_code);
      attributionMethod = 'referral_code';
    }

    // If no affiliate found, log the conversion but don't create commission
    if (!affiliate) {
      console.log('Conversion received but no affiliate attribution found:', {
        event_type,
        customer_email,
        attribution_key,
        referral_code,
      });

      return NextResponse.json({
        success: true,
        message: __tr("Conversion logged (no attribution)"),
        attributed: false,
      });
    }

    // Create conversion record
    const conversion = await db.createConversion({
      affiliateId: affiliate.id,
      eventType: event_type,
      amountCents: amount_cents || 0,
      currency,
      eventMetadata: {
        ...event_metadata,
        customerEmail: customer_email,
        attributionMethod,
        attributionKey: attribution_key,
        referralCode: referral_code,
      },
    });

    // Calculate commission
    const commissionRules = await db.getCommissionRules();
    let applicableRule = commissionRules.find((rule: any) => rule.isDefault);

    const commissionRate = applicableRule?.value || 15;
    let commissionAmount = 0;

    if (applicableRule?.type === 'PERCENTAGE' && amount_cents) {
      commissionAmount = Math.floor((amount_cents * commissionRate) / 100);
    } else if (applicableRule?.type === 'FIXED') {
      commissionAmount = commissionRate;
    }

    // ─── Commission Hold Period ─────────────────────────────────
    // Fetch hold days from ProgramSettings (default 30)
    const settings = await prisma.programSettings.findFirst();
    const holdDays = (settings as any)?.commissionHoldDays ?? 30;
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
      actorId: 'system',
      action: 'conversion_tracked',
      objectType: 'conversion',
      objectId: conversion.id,
      payload: {
        event_type,
        amount_cents,
        commission_amount: commissionAmount,
        affiliate_id: affiliate.id,
        attributionMethod,
      },
    });

    return NextResponse.json({
      success: true,
      message: __tr("Conversion tracked successfully"),
      attributed: true,
      conversion,
      commission,
      attributionMethod,
    });
  } catch (error) {
    console.error('Conversion webhook error:', error);
    return NextResponse.json(
      { success: false, message: __tr("Failed to process conversion") },
      { status: 500 }
    );
  }
}
export const POST = withSystemLocale(POSTHandler);
