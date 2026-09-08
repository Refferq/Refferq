import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailService } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

 async function POSTHandler(request: NextRequest) {
  try {
    // Rate limit: 3 registration attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/register', 3, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: __tr("Too many registration attempts. Please try again later.") },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() } }
      );
    }

    const body = await request.json();
    const { email, name, role } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: __tr("Email and name are required") },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: __tr("Invalid email format") },
        { status: 400 }
      );
    }

    // SECURITY: Never allow self-registration as admin
    const userRole = 'AFFILIATE';

    // Generate a cryptographically secure random password
    const crypto = await import('crypto');
    const randomPassword = crypto.randomBytes(24).toString('base64url');

    const result = await auth.register({
      email: email.toLowerCase().trim(),
      password: randomPassword,
      name: name.trim(),
      role: userRole,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // Send welcome email (non-blocking - don't fail registration if email fails)
    try {
      // Send welcome email with login URL
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.refferq.com'}/login`;
      await emailService.sendWelcomeEmail({
        name: result.user!.name,
        email: result.user!.email,
        role: result.user!.role.toLowerCase() as 'affiliate' | 'admin',
        loginUrl,
        password: randomPassword,
      });
      console.log('✅ Welcome email sent to:', result.user!.email);
    } catch (emailError) {
      // Log email error but don't fail the registration
      console.error('⚠️ Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name,
        role: result.user?.role,
        status: result.user?.status,
      },
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { success: false, message: __tr("Registration failed") },
      { status: 500 }
    );
  }
}
export const POST = withSystemLocale(POSTHandler);
