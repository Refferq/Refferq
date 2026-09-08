import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { prisma } from '@/lib/prisma';


// Only allow in development, or require admin auth in production
async function requireAdminOrDev(request: NextRequest): Promise<{ error?: string; status?: number }> {
  try {
    // Block entirely in production unless authenticated as admin
    const userId = request.headers.get('x-user-id')!;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user || user.role !== 'ADMIN') {
      return { error: __tr("Admin access required"), status: 403 };
    }
    return {};
  } catch (_error) {
    return { error: __tr("Invalid token"), status: 401 };
  }
}

 async function POSTHandler(request: NextRequest) {
  const auth = await requireAdminOrDev(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Test email functionality
    const result = await emailService.sendWelcomeEmail({
      name: __tr("Test User"),
      email: 'test@example.com',
      role: 'affiliate',
      loginUrl: 'http://localhost:3000',
    });

    return NextResponse.json({
      success: true,
      message: __tr("Test email sent successfully"),
      // emailId: result.emailId, // Property doesn't exist on result
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: __tr("Failed to send test email"),
      },
      { status: 500 }
    );
  }
}

 async function GETHandler(request: NextRequest) {
  const auth = await requireAdminOrDev(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    success: true,
    message: __tr("Email test endpoint is working"),
    config: {
      apiKeyConfigured: !!process.env.RESEND_API_KEY,
      environment: process.env.NODE_ENV,
    },
  });
}
export const POST = withSystemLocale(POSTHandler);
export const GET = withSystemLocale(GETHandler);
