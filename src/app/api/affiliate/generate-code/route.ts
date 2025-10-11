import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${cleanName.substr(0, 6)}-${random}`;
}

/**
 * POST /api/affiliate/generate-code - Generate or regenerate referral code
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Affiliate role required.' },
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
        message: 'Affiliate profile created with referral code',
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
        message: 'Referral code generated',
        affiliate,
      });
    }

    // Affiliate already has a referral code
    return NextResponse.json({
      success: true,
      message: 'Referral code already exists',
      affiliate,
    });

  } catch (error) {
    console.error('Generate code API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate referral code' },
      { status: 500 }
    );
  }
}
