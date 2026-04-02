import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asJsonObject, asNumber, asString } from '@/lib/json-utils';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    // Get user from database to ensure they still exist and get latest data
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    const affiliate = user.affiliate;
    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      );
    }

    // Get affiliate statistics
    const referrals = await prisma.referral.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' }
    });

    const conversions = await prisma.conversion.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' }
    });

    const commissions = await prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    // Available earnings = COMPLETED (PAID) + APPROVED but not yet paid
    const availableEarnings = commissions
      .filter(c => c.status === 'PAID' || c.status === 'APPROVED')
      .reduce((sum, c) => sum + c.amountCents, 0);

    const pendingCommissionsList = commissions.filter(c => c.status === 'PENDING');
    const pendingEarningsCents = pendingCommissionsList.reduce((sum, c) => sum + c.amountCents, 0);

    const totalCommissions = commissions.length;
    const pendingCommissionsCount = pendingCommissionsList.length;
    const totalConversions = conversions.length;
    const totalClicks = referrals.reduce((sum, r) => {
      const metadata = asJsonObject(r.metadata);
      return sum + asNumber(metadata.clicks, 0);
    }, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Next maturation date for pending commissions
    const nextMaturesAt = pendingCommissionsList
      .filter((commission) => commission.maturesAt !== null)
      .sort((a, b) => {
        const aTime = a.maturesAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime = b.maturesAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })[0]?.maturesAt || null;

    const stats = {
      totalEarnings: availableEarnings,
      pendingEarnings: pendingEarningsCents,
      pendingEarningsList: pendingCommissionsList.length,
      nextMaturesAt,
      totalCommissions,
      pendingCommissions: pendingCommissionsCount,
      totalConversions,
      totalClicks,
      conversionRate
    };

    // Map referrals to include estimatedValue from metadata
    const mappedReferrals = referrals.map(ref => {
      const metadata = asJsonObject(ref.metadata);
      return {
        ...ref,
        estimatedValue: asNumber(metadata.estimated_value, 0),
        company: asString(metadata.company, ''),
      };
    });

    // Get currency symbol
    const { getCurrencySymbol } = await import('@/lib/currency');
    const currencySymbol = await getCurrencySymbol();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      affiliate: affiliate,
      stats,
      referrals: mappedReferrals,
      conversions,
      commissions,
      currencySymbol,
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
    const userUpdateData: Prisma.UserUpdateInput = {};
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
      const existingPayoutDetails = asJsonObject(user.affiliate.payoutDetails);
      const payoutDetailsUpdate: Record<string, unknown> = { ...existingPayoutDetails };

      if (company) payoutDetailsUpdate.company = company.trim();
      if (country) payoutDetailsUpdate.country = country;
      if (paymentMethod) payoutDetailsUpdate.paymentMethod = paymentMethod;
      if (paymentEmail) payoutDetailsUpdate.paymentEmail = paymentEmail.trim();

      await prisma.affiliate.update({
        where: { id: user.affiliate.id },
        data: {
          payoutDetails: payoutDetailsUpdate as Prisma.InputJsonObject
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
