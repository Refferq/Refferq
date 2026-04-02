import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function verifyAdmin(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '6m'; // 3m, 6m, 12m
    const groupBy = url.searchParams.get('groupBy') || 'month'; // week, month

    // Calculate start date
    const now = new Date();
    const monthsMap: Record<string, number> = { '3m': 3, '6m': 6, '12m': 12 };
    const months = monthsMap[period] || 6;
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    // Get all affiliates created within the period
    const affiliates = await prisma.affiliate.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        user: { select: { name: true, email: true, status: true, createdAt: true } },
        referrals: {
          select: { id: true, status: true, createdAt: true },
        },
        commissions: {
          select: { id: true, amountCents: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group affiliates into cohorts by join month/week
    const cohorts = new Map<string, {
      label: string;
      startDate: Date;
      affiliateCount: number;
      totalReferrals: number;
      approvedReferrals: number;
      totalCommissions: number;
      totalEarnings: number;
      retention: Record<string, number>; // period label → active count
    }>();

    for (const affiliate of affiliates) {
      const joinDate = affiliate.createdAt;
      let cohortKey: string;
      let cohortLabel: string;
      let cohortStart: Date;

      if (groupBy === 'week') {
        const weekStart = new Date(joinDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        cohortKey = weekStart.toISOString().slice(0, 10);
        cohortLabel = `Week of ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        cohortStart = weekStart;
      } else {
        cohortKey = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
        cohortLabel = joinDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        cohortStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
      }

      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, {
          label: cohortLabel,
          startDate: cohortStart,
          affiliateCount: 0,
          totalReferrals: 0,
          approvedReferrals: 0,
          totalCommissions: 0,
          totalEarnings: 0,
          retention: {},
        });
      }

      const cohort = cohorts.get(cohortKey)!;
      cohort.affiliateCount++;
      cohort.totalReferrals += affiliate.referrals.length;
      cohort.approvedReferrals += affiliate.referrals.filter((r) => r.status === 'APPROVED').length;
      cohort.totalCommissions += affiliate.commissions.length;
      cohort.totalEarnings += affiliate.commissions.reduce((sum, c) => sum + c.amountCents, 0);

      // Calculate retention: which periods after joining did this affiliate have activity?
      for (const referral of affiliate.referrals) {
        const refDate = new Date(referral.createdAt);
        const monthsAfterJoin = Math.floor(
          (refDate.getTime() - cohortStart.getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
        const periodLabel = groupBy === 'week'
          ? `W${Math.floor((refDate.getTime() - cohortStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`
          : `M${monthsAfterJoin}`;
        cohort.retention[periodLabel] = (cohort.retention[periodLabel] || 0) + 1;
      }
    }

    // Convert cohorts map to array
    const cohortData = Array.from(cohorts.entries()).map(([key, cohort]) => ({
      cohortKey: key,
      label: cohort.label,
      startDate: cohort.startDate,
      affiliateCount: cohort.affiliateCount,
      totalReferrals: cohort.totalReferrals,
      approvedReferrals: cohort.approvedReferrals,
      conversionRate: cohort.totalReferrals > 0
        ? ((cohort.approvedReferrals / cohort.totalReferrals) * 100).toFixed(1)
        : '0',
      totalCommissions: cohort.totalCommissions,
      totalEarningsCents: cohort.totalEarnings,
      avgEarningsPerAffiliateCents: cohort.affiliateCount > 0
        ? Math.round(cohort.totalEarnings / cohort.affiliateCount)
        : 0,
      retention: cohort.retention,
    }));

    // Overall summary
    const totalAffiliates = affiliates.length;
    const activeAffiliates = affiliates.filter((a) => a.referrals.length > 0).length;
    const avgReferralsPerAffiliate = totalAffiliates > 0
      ? (affiliates.reduce((sum, a) => sum + a.referrals.length, 0) / totalAffiliates).toFixed(1)
      : '0';

    return NextResponse.json({
      success: true,
      cohortAnalysis: {
        period,
        groupBy,
        summary: {
          totalCohorts: cohortData.length,
          totalAffiliates,
          activeAffiliates,
          activationRate: totalAffiliates > 0
            ? ((activeAffiliates / totalAffiliates) * 100).toFixed(1)
            : '0',
          avgReferralsPerAffiliate,
        },
        cohorts: cohortData,
      },
    });
  } catch (error) {
    console.error('Cohort analysis error:', error);
    return NextResponse.json({ error: 'Failed to generate cohort analysis' }, { status: 500 });
  }
}
