import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { otpService } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rate-limit';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { canBootstrapFirstAdmin, normalizeAffiliateEmail } from '@/lib/affiliate-auth-policy';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.JWT_SECRET || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json({ success: false, message: 'Registration service is temporarily unavailable' }, { status: 503 });
    }
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const rate = await checkRateLimit(ip, 'auth/register', 3, 60_000);
    if (!rate.allowed) return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (name.length < 2 || name.length > 100 || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Enter a valid name and email address' }, { status: 400 });
    }

    const allowedAdminEmails = (process.env.ADMIN_EMAILS || '').split(',')
      .map(normalizeAffiliateEmail).filter(Boolean);
    const adminAddress = allowedAdminEmails.includes(email);
    const existingAdminCount = adminAddress
      ? await prisma.user.count({ where: { role: 'ADMIN' } })
      : 0;

    if (adminAddress) {
      if (!canBootstrapFirstAdmin({
        email,
        allowlist: process.env.ADMIN_EMAILS || '',
        environment: process.env.VERCEL_ENV,
        enabled: process.env.ENABLE_INITIAL_ADMIN_BOOTSTRAP,
        existingAdminCount,
      })) {
        return NextResponse.json({ success: false, message: 'Administrator setup is unavailable.' }, { status: 403 });
      }
      // Public input can never specify a role; a server-only allowlist decides.
      // Admin remains PENDING until the owner proves inbox possession via OTP.
      const password = await bcrypt.hash(randomBytes(32).toString('base64url'), 12);
      try {
        await prisma.user.create({
          data: { name, email, password, role: 'ADMIN', status: 'PENDING' },
        });
      } catch {
        return NextResponse.json({
          success: false,
          message: 'This administrator email is already registered. Use the sign-in page to request an OTP.',
        }, { status: 409 });
      }
    } else {
      // Ordinary public registration is always an affiliate, never an admin.
      const created = await auth.register({
        name, email, role: 'AFFILIATE',
        password: randomBytes(32).toString('base64url'),
      });
      if (!created.success) {
        return NextResponse.json({ success: false, message: created.message }, { status: 400 });
      }
    }
    const delivered = await otpService.sendOTP(email);
    return NextResponse.json({
      success: true,
      otpSent: delivered.success,
      message: delivered.success
        ? 'Account created. Check your email for the verification code.'
        : 'Account created, but the code could not be sent. Use Resend code to retry.',
    }, { status: 201 });
  } catch (error) {
    console.error('Registration failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 });
  }
}
