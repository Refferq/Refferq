import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asJsonObject, asNumber } from '@/lib/json-utils';


export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const parsedDays = Number(url.searchParams.get('days') || '30');
    const days = Number.isFinite(parsedDays)
      ? Math.max(1, Math.min(365, Math.floor(parsedDays)))
      : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Calculate platform stats
    const totalAffiliates = await prisma.affiliate.count();
    const totalUsers = await prisma.user.count();
    const totalReferrals = await prisma.referral.count();
    const totalConversions = await prisma.conversion.count();
    
    const pendingReferrals = await prisma.referral.count({
      where: { status: 'PENDING' }
    });
    
    const approvedReferrals = await prisma.referral.count({
      where: { status: 'APPROVED' }
    });
    
    // Calculate ACTUAL transaction revenue from conversions
    const totalRevenue = await prisma.conversion.aggregate({
      _sum: { amountCents: true }
    });
    
    // Calculate ESTIMATED revenue from referrals (leads)
    const referrals = await prisma.referral.findMany({
      include: {
        affiliate: true
      }
    });
    
    // Get all partner groups for commission rate lookup
    const partnerGroups = await prisma.partnerGroup.findMany();
    const partnerGroupMap = new Map(
      partnerGroups.map(pg => [pg.id, pg.commissionRate])
    );
    
    let totalEstimatedRevenue = 0;
    let totalEstimatedCommission = 0;
    
    referrals.forEach((ref) => {
      const metadata = asJsonObject(ref.metadata);
      const estimatedValue = asNumber(metadata.estimated_value, 0);
      const valueInCents = estimatedValue * 100;
      
      // Get commission rate from partner group or default to 20%
      const partnerGroupId = ref.affiliate.partnerGroupId;
      const commissionRate = partnerGroupId 
        ? (partnerGroupMap.get(partnerGroupId) || 0.20)
        : 0.20;
      const commissionInCents = Math.floor(valueInCents * commissionRate);
      
      totalEstimatedRevenue += valueInCents;
      totalEstimatedCommission += commissionInCents;
    });

    const [
      duplicateEvents,
      rejectedEvents,
      unattributedEvents,
      attributedEvents,
    ] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: 'conversion_duplicate',
          createdAt: { gte: startDate },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'conversion_rejected',
          createdAt: { gte: startDate },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'conversion_unattributed',
          createdAt: { gte: startDate },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'conversion_attributed',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    const stats = {
      totalAffiliates,
      totalUsers,
      totalReferrals,
      totalConversions,
      pendingReferrals,
      approvedReferrals,
      totalRevenue: totalRevenue._sum?.amountCents || 0, // Actual transaction revenue
      totalEstimatedRevenue, // Estimated revenue from all leads
      totalEstimatedCommission, // Total commission to be paid
      eventProcessing: {
        windowDays: days,
        duplicates: duplicateEvents,
        rejected: rejectedEvents,
        unattributed: unattributedEvents,
        attributed: attributedEvents,
      },
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
