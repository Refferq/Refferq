import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


 async function GETHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: __tr("User not found") },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Admin access required") },
        { status: 403 }
      );
    }

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
      const metadata = ref.metadata as any;
      const estimatedValue = Number(metadata?.estimated_value) || 0;
      const valueInCents = estimatedValue * 100;
      
      // Get commission rate from partner group or default to 20%
      const affiliate = ref.affiliate as any;
      const partnerGroupId = affiliate.partnerGroupId;
      const commissionRate = partnerGroupId 
        ? (partnerGroupMap.get(partnerGroupId) || 0.20)
        : 0.20;
      const commissionInCents = Math.floor(valueInCents * commissionRate);
      
      totalEstimatedRevenue += valueInCents;
      totalEstimatedCommission += commissionInCents;
    });

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
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(
      { error: __tr("Failed to fetch admin data") },
      { status: 500 }
    );
  }
}
export const GET = withSystemLocale(GETHandler);
