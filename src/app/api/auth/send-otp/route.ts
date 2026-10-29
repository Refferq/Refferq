import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const rate = await checkRateLimit(ip, 'auth/send-otp', 3, 60_000);
    if (!rate.allowed) return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email address' }, { status: 400 });
    }
    const result = await otpService.sendOTP(email);
    return NextResponse.json(result, { status: result.success ? 200 : 429 });
  } catch {
    return NextResponse.json({ success: false, message: 'Could not send verification code' }, { status: 500 });
  }
}
