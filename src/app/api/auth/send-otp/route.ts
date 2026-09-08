import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rate-limit';

 async function POSTHandler(request: NextRequest) {
  try {
    // Rate limit: 3 OTP sends per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/send-otp', 3, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: __tr("Too many OTP requests. Please try again later.") },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: __tr("Email is required") },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: __tr("Invalid email format") },
        { status: 400 }
      );
    }

    const result = await otpService.sendOTP(email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: __tr("Internal server error") },
      { status: 500 }
    );
  }
}
export const POST = withSystemLocale(POSTHandler);
