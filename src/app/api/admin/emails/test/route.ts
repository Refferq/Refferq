import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function verifyAuth(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// POST - Send test email
export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Fetch the template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get admin user email
    const adminUser = await prisma.user.findUnique({
      where: { id: user.userId as string },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Replace variables with test data
    let testSubject = template.subject;
    let testBody = template.body;

    const testVariables: Record<string, string> = {
      partner_name: 'John Doe',
      program_name: 'Test Affiliate Program',
      referral_link: 'https://example.com/ref/ABC123',
      referral_name: 'Jane Smith',
      referral_email: 'jane@example.com',
      referral_count: '5',
      amount: '$250.00',
      payout_method: 'PayPal',
      partner_email: adminUser.email,
      signup_link: 'https://example.com/signup',
      dashboard_link: 'https://example.com/dashboard',
      reason: 'Does not meet our criteria',
    };

    // Replace all variables in subject and body
    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      testSubject = testSubject.replace(regex, value);
      testBody = testBody.replace(regex, value);
    });

    // Log the test email (in production, you'd actually send it via email service)
    const emailLog = await prisma.emailLog.create({
      data: {
        templateId: template.id,
        recipientId: user.userId as string,
        recipientEmail: adminUser.email,
        subject: testSubject,
        body: testBody,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          isTest: true,
          sentBy: String(user.userId),
        } as any,
      },
    });

    // In production, integrate with email service like:
    // - SendGrid
    // - AWS SES
    // - Postmark
    // - Resend
    // For now, we'll just simulate sending
    console.log('Test email would be sent to:', adminUser.email);
    console.log('Subject:', testSubject);
    console.log('Body:', testBody);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${adminUser.email}`,
      emailLog,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
