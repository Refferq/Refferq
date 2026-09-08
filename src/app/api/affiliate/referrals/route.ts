import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

 async function POSTHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    // Get user from database

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: __tr("User not found") },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { error: __tr("Access denied. Affiliate role required.") },
        { status: 403 }
      );
    }

    if (!user.affiliate) {
      return NextResponse.json(
        { error: __tr("Affiliate profile not found") },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const { success, data, error: validationError } = await import('@/lib/validations').then(m => m.referralSchema.safeParse(body));

    if (!success) {
      return NextResponse.json(
        { error: __tr("Validation failed"), details: validationError.issues },
        { status: 400 }
      );
    }

    const { leadName, leadEmail, company, notes, estimatedValue } = data;

    // Create the referral
    const referral = await prisma.referral.create({
      data: {
        affiliateId: user.affiliate.id,
        leadName: leadName.trim(),
        leadEmail: leadEmail.toLowerCase().trim(),
        status: 'PENDING',
        metadata: {
          company: company || '',
          notes: notes || '',
          source: 'manual',
          estimated_value: estimatedValue || 0,
        },
      }
    });

    return NextResponse.json({
      success: true,
      message: __tr("Referral submitted successfully"),
      referral,
    });
  } catch (error) {
    console.error('Submit referral API error:', error);
    return NextResponse.json(
      { error: __tr("Failed to submit referral") },
      { status: 500 }
    );
  }
}

 async function GETHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    // Get user from database

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: __tr("User not found") },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { error: __tr("Access denied. Affiliate role required.") },
        { status: 403 }
      );
    }

    if (!user.affiliate) {
      return NextResponse.json(
        { error: __tr("Affiliate profile not found") },
        { status: 404 }
      );
    }

    const referrals = await prisma.referral.findMany({
      where: { affiliateId: user.affiliate.id },
      orderBy: { createdAt: 'desc' }
    });

    // Map referrals to include estimatedValue from metadata
    const mappedReferrals = referrals.map((ref: any) => {
      const metadata = ref.metadata as any;
      return {
        ...ref,
        estimatedValue: Number(metadata?.estimated_value) || 0,
        company: metadata?.company || '',
      };
    });

    return NextResponse.json({
      success: true,
      referrals: mappedReferrals,
    });
  } catch (error) {
    console.error('Get referrals API error:', error);
    return NextResponse.json(
      { error: __tr("Failed to fetch referrals") },
      { status: 500 }
    );
  }
}
export const POST = withSystemLocale(POSTHandler);
export const GET = withSystemLocale(GETHandler);
