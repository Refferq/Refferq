import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Test email functionality
    const result = await emailService.sendWelcomeEmail({
      name: 'Test User',
      email: 'test@example.com',
      role: 'affiliate',
      loginUrl: 'http://localhost:3000',
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      // emailId: result.emailId, // Property doesn't exist on result
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Email test endpoint is working',
    config: {
      apiKeyConfigured: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
      environment: process.env.NODE_ENV,
    },
  });
}