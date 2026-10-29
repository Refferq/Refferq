import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp';
import { SignJWT } from 'jose';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const rate = await checkRateLimit(ip, 'auth/verify-otp', 5, 60_000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many attempts' }, { status: 429 });
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
    }
    const result = await otpService.verifyOTP(email, code);
    if (!result.success) return NextResponse.json({ success: false, error: result.message }, { status: 400 });

    if (result.pendingApproval) {
      // Verify ownership; do NOT issue an authentication session before admin approval.
      return NextResponse.json({ success: true, pendingApproval: true, message: result.message });
    }
    const user = result.user;
    if (!user || user.status !== 'ACTIVE' || !process.env.JWT_SECRET) {
      return NextResponse.json({ success: false, error: 'Account not active' }, { status: 403 });
    }
    const token = await new SignJWT({ userId: user.id, role: user.role, email: user.email, name: user.name })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    const response = NextResponse.json({
      success: true,
      pendingApproval: false,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, hasAffiliate: Boolean(user.affiliate) },
    });
    response.cookies.set('auth-token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 86400, path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
