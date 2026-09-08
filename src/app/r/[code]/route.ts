import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── Open Redirect Protection ─────────────────────────────────
function isAllowedRedirectUrl(url: string, appUrl: string, websiteUrl?: string): boolean {
  try {
    const parsed = new URL(url);
    const appParsed = new URL(appUrl);

    // Always allow the app domain and its subdomains
    const allowedDomains = [appParsed.hostname];

    // Also allow the marketing site domain if defined
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      try { allowedDomains.push(new URL(siteUrl).hostname); } catch (_e) { }
    }

    // IMPORTANT: Allow the program's configured website URL
    if (websiteUrl) {
      try { allowedDomains.push(new URL(websiteUrl).hostname); } catch (_e) { }
    }

    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      )
    );
  } catch (_e) {
    return false;
  }
}

 async function GETHandler(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const referralCode = code;
    const searchParams = request.nextUrl.searchParams;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.refferq.com';

    // Support both 'target' and 'dest' (Plan called it 'dest')
    const rawTarget = searchParams.get('dest') || searchParams.get('target');

    // Fetch ProgramSettings to get the allowed websiteUrl (for domain validation)
    // We'll use the cached method from DatabaseService if possible, or just query prisma
    const settings = await prisma.programSettings.findFirst();
    const websiteUrl = settings?.websiteUrl;

    // Validate redirect target to prevent open redirect attacks
    const targetUrl = (rawTarget && isAllowedRedirectUrl(rawTarget, appUrl, websiteUrl))
      ? rawTarget
      : websiteUrl || appUrl; // Fallback to program website or app URL

    // Find affiliate by referral code using Prisma
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
      include: { user: true }
    });

    if (!affiliate) {
      // Invalid referral code - redirect to default URL
      return NextResponse.redirect(targetUrl);
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const cleanIP = clientIP.split(',')[0].trim();
    const userAgent = request.headers.get('user-agent') || __tr("Unknown");
    const referer = request.headers.get('referer') || null;

    // ─── Fraud Detection ───────────────────────────────────────
    const { checkFraud } = await import('@/lib/fraud-detection');
    const fraudResult = await checkFraud({
      ipAddress: cleanIP,
      userAgent,
      affiliateId: affiliate.id,
    });

    // Generate attribution key
    const attributionKey = `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Find or create a referral record for click tracking
    let referral = await prisma.referral.findFirst({
      where: {
        affiliateId: affiliate.id,
        leadEmail: `click-${attributionKey}@tracking.internal`,
      }
    });

    if (!referral) {
      referral = await prisma.referral.create({
        data: {
          affiliateId: affiliate.id,
          leadName: __tr("Click Visitor"),
          leadEmail: `click-${attributionKey}@tracking.internal`,
          status: 'PENDING',
          metadata: {
            source: 'referral_link',
            attribution_key: attributionKey,
            target_url: targetUrl,
            params: Object.fromEntries(searchParams.entries()),
          }
        }
      });
    }

    // Track the click in ReferralClick table (always track, even if suspicious)
    await prisma.referralClick.create({
      data: {
        referralId: referral.id,
        ipAddress: cleanIP,
        userAgent: userAgent,
        referer: referer,
        metadata: {
          attribution_key: attributionKey,
          target_url: targetUrl,
          is_deep_link: !!searchParams.get('dest'),
          fraud_check: {
            is_suspicious: fraudResult.isSuspicious,
            risk_score: fraudResult.riskScore,
            reasons: fraudResult.reasons,
          },
        }
      }
    });

    // Create redirect response with attribution cookie
    const redirectUrl = new URL(targetUrl);

    // Preserve existing search params on the target URL (important for deep linking)
    searchParams.forEach((value, key) => {
      // Don't override existing ref/attr if they happen to be there, and don't pass dest/target again
      if (!['ref', 'attr', 'dest', 'target'].includes(key)) {
        redirectUrl.searchParams.set(key, value);
      }
    });

    redirectUrl.searchParams.set('ref', referralCode);
    redirectUrl.searchParams.set('attr', attributionKey);

    const response = NextResponse.redirect(redirectUrl.toString());

    // Set attribution cookie (expires in 30 days)
    const cookieExpiry = new Date();
    cookieExpiry.setDate(cookieExpiry.getDate() + 30);

    response.cookies.set('affiliate_attribution', JSON.stringify({
      referral_code: referralCode,
      attribution_key: attributionKey,
      affiliate_id: affiliate.id,
      timestamp: new Date().toISOString(),
    }), {
      expires: cookieExpiry,
      httpOnly: false, // Allow client-side access for conversion tracking
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Referral tracking error:', error);

    // Fallback redirect on error (safe — always redirects to app URL)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.refferq.com';
    return NextResponse.redirect(appUrl);
  }
}
export const GET = withSystemLocale(GETHandler);
