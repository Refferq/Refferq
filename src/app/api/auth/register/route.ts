import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Only allow AFFILIATE role for self-registration
    const userRole = role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'AFFILIATE';

    // Generate a random password (won't be used since we use OTP)
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

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
      { success: false, message: 'Registration failed' },
      { status: 500 }
    );
  }
}