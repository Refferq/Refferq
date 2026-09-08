import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';


async function verifyAuth(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') return null;
    return user;
  } catch (_e) {
    return null;
  }
}

// POST - Send test email
 async function POSTHandler(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, email } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: __tr("Template ID is required") },
        { status: 400 }
      );
    }

    // Fetch the template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: __tr("Template not found") },
        { status: 404 }
      );
    }

    // Get admin user email — user is already fetched from DB
    const recipientEmail = email || user.email;

    // Replace variables with test data
    let testSubject = template.subject;
    let testBody = template.body;

    const testVariables: Record<string, string> = {
      partner_name: __tr("John Doe"),
      program_name: __tr("Test Affiliate Program"),
      referral_link: 'https://example.com/ref/ABC123',
      referral_name: __tr("Jane Smith"),
      referral_email: 'jane@example.com',
      referral_count: '5',
      amount: '$250.00',
      payout_method: __tr("PayPal"),
      partner_email: user.email,
      signup_link: 'https://example.com/signup',
      dashboard_link: 'https://example.com/dashboard',
      reason: __tr("Does not meet our criteria"),
    };

    // Replace all variables in subject and body
    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      testSubject = testSubject.replace(regex, value);
      testBody = testBody.replace(regex, value);
    });

    // Actually send the test email via Resend
    try {
      await emailService.sendCustomEmail(
        recipientEmail,
        __tr("[TEST] {0}", [testSubject]),
        testBody
      );
    } catch (emailError) {
      console.error('Email send failed:', emailError);
    }

    // Log the test email
    const emailLog = await prisma.emailLog.create({
      data: {
        templateId: template.id,
        recipientId: user.id,
        recipientEmail: recipientEmail,
        subject: __tr("[TEST] {0}", [testSubject]),
        body: testBody,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          isTest: true,
          sentBy: user.id,
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: __tr("Test email sent to {0}", [recipientEmail]),
      emailLog,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: __tr("Failed to send test email") },
      { status: 500 }
    );
  }
}

export const POST = withSystemLocale(POSTHandler);
