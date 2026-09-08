import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `${cleanName.substr(0, 6)}-${random}`;
}

/**
 * POST /api/affiliate/generate-code - Generate or regenerate referral code
 */
 async function POSTHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: __tr("User not found") },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { success: false, error: __tr("Access denied. Affiliate role required.") },
        { status: 403 }
      );
    }

    let affiliate = user.affiliate;

    // If affiliate record doesn't exist, create it
    if (!affiliate) {
      const referralCode = generateReferralCode(user.name);
      
      affiliate = await prisma.affiliate.create({
        data: {
          userId: user.id,
          referralCode,
          payoutDetails: {},
          balanceCents: 0
        }
      });

      return NextResponse.json({
        success: true,
        message: __tr("Affiliate profile created with referral code"),
        affiliate,
      });
    }

    // If affiliate exists but no referral code, generate one
    if (!affiliate.referralCode || affiliate.referralCode.trim() === '') {
      const referralCode = generateReferralCode(user.name);
      
      affiliate = await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { referralCode }
      });

      return NextResponse.json({
        success: true,
        message: __tr("Referral code generated"),
        affiliate,
      });
    }

    // Affiliate already has a referral code
    return NextResponse.json({
      success: true,
      message: __tr("Referral code already exists"),
      affiliate,
    });

  } catch (error) {
    console.error('Generate code API error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to generate referral code") },
      { status: 500 }
    );
  }
}

export const POST = withSystemLocale(POSTHandler);
