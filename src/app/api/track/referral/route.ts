import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateTrackingApiKey } from '@/lib/tracking-auth';
import { buildTrackingCorsHeaders } from '@/lib/tracking-cors';

/**
 * POST /api/track/referral - Track referral clicks
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

    const body = await req.json();
    const { referralCode, url, referrer, userAgent, timestamp } = body;

    if (!referralCode) {
      return withCors(NextResponse.json(
        { success: false, error: 'Referral code is required' },
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

    // Create a synthetic referral lead to preserve click-level attribution in DB.
    const attributionKey = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const referral = await prisma.referral.create({
      data: {
        affiliateId: affiliate.id,
        leadName: 'Tracked Click',
        leadEmail: `click-${attributionKey}@tracking.internal`,
        status: 'PENDING',
        metadata: {
          source: 'track_referral_api',
          url: url || null,
          referrer: referrer || null,
          timestamp: timestamp || new Date().toISOString(),
          attribution_key: attributionKey,
          key_source: keyValidation.source,
        },
      },
    });

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    await prisma.referralClick.create({
      data: {
        referralId: referral.id,
        ipAddress,
        userAgent: userAgent || req.headers.get('user-agent') || null,
        referer: referrer || null,
        metadata: {
          source: 'track_referral_api',
          attribution_key: attributionKey,
        },
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Referral tracked successfully',
      affiliate: {
        name: affiliate.user.name,
        code: affiliate.referralCode,
      },
      attributionKey,
    });

    withCors(response);

    if (keyValidation.source === 'integration_settings') {
      response.headers.set('X-Refferq-Key-Mode', 'legacy-public-key');
    }

    return response;
  } catch (error) {
    console.error('POST /api/track/referral error:', error);
    return withCors(NextResponse.json(
      { success: false, error: 'Failed to track referral' },
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
