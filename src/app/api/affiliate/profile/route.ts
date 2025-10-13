import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Get user from database to ensure they still exist and get latest data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { error: 'Access denied. Affiliate role required.' },
        { status: 403 }
      );
    }

    if (!user.affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      );
    }

    // Get affiliate statistics
    const referrals = await prisma.referral.findMany({
      where: { affiliateId: user.affiliate.id },
      orderBy: { createdAt: 'desc' }
    });

    const conversions = await prisma.conversion.findMany({
      where: { affiliateId: user.affiliate.id },
      orderBy: { createdAt: 'desc' }
    });

    const commissions = await prisma.commission.findMany({
      where: { affiliateId: user.affiliate.id },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const totalEarnings = commissions
      .filter(c => c.status === 'PAID')
      .reduce((sum, c) => sum + c.amountCents, 0);

    const pendingEarnings = commissions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amountCents, 0);

    const totalCommissions = commissions.length;
    const pendingCommissions = commissions.filter(c => c.status === 'PENDING').length;
    const totalConversions = conversions.length;
    const totalClicks = referrals.reduce((sum, r) => {
      const metadata = r.metadata as any;
      return sum + (metadata?.clicks || 0);
    }, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    const stats = {
      totalEarnings,
      pendingEarnings,
      totalCommissions,
      pendingCommissions,
      totalConversions,
      totalClicks,
      conversionRate
    };

    // Map referrals to include estimatedValue from metadata
    const mappedReferrals = referrals.map(ref => {
      const metadata = ref.metadata as any;
      return {
        ...ref,
        estimatedValue: Number(metadata?.estimated_value) || 0,
        company: metadata?.company || '',
      };
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      affiliate: user.affiliate,
      stats,
      referrals: mappedReferrals,
      conversions,
      commissions,
    });
  } catch (error) {
    console.error('Affiliate profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
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
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { error: 'Access denied. Affiliate role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, company, email, country, paymentMethod, paymentEmail } = body;

    // Update user name and email if provided
    const userUpdateData: any = {};
    if (name && name.trim()) {
      userUpdateData.name = name.trim();
    }
    if (email && email.trim() && email !== user.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() }
      });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
      userUpdateData.email = email.trim().toLowerCase();
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdateData
      });
    }

    // Update affiliate payout details if provided
    if (user.affiliate) {
      const payoutDetails: any = {};
      
      if (company) payoutDetails.company = company.trim();
      if (country) payoutDetails.country = country;
      if (paymentMethod) payoutDetails.paymentMethod = paymentMethod;
      if (paymentEmail) payoutDetails.paymentEmail = paymentEmail.trim();

      await prisma.affiliate.update({
        where: { id: user.affiliate.id },
        data: { 
          payoutDetails: payoutDetails
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Affiliate profile update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}