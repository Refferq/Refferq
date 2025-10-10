import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const referralCode = code;
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('target') || 'https://example.com'; // Default target

    // Find affiliate by referral code
    const affiliate = await db.getAffiliateByReferralCode(referralCode);
    
    if (!affiliate) {
      // Invalid referral code - redirect to default URL
      return NextResponse.redirect(targetUrl);
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Generate attribution key
    const attributionKey = `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Track the click
    await db.createReferralClick({
      referral_code: referralCode,
      ip: clientIP,
      user_agent: userAgent,
      cookie_attribution_key: attributionKey,
    });

    // Create redirect response with attribution cookie
    const redirectUrl = new URL(targetUrl);
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
    
    // Fallback redirect on error
    const targetUrl = request.nextUrl.searchParams.get('target') || 'https://example.com';
    return NextResponse.redirect(targetUrl);
  }
}