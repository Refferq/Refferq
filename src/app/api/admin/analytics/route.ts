import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
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

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get date range from query params (default to last 30 days)
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Top performing affiliates
    const topAffiliates = await prisma.affiliate.findMany({
      take: 10,
      orderBy: {
        balanceCents: 'desc'
      },
      include: {
        user: true,
        referrals: {
          where: {
            status: 'APPROVED'
          }
        },
        commissions: {
          where: {
            status: 'APPROVED'
          }
        }
      }
    });

    // Referral conversion rate
    const totalReferrals = await prisma.referral.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const approvedReferrals = await prisma.referral.count({
      where: {
        status: 'APPROVED',
        createdAt: { gte: startDate }
      }
    });

    const conversionRate = totalReferrals > 0 ? (approvedReferrals / totalReferrals) * 100 : 0;

    // Revenue over time (daily)
    const dailyRevenue = await prisma.conversion.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate }
      },
      _sum: {
        amountCents: true
      }
    });

    // Commission statistics
    const totalCommissions = await prisma.commission.aggregate({
      _sum: { amountCents: true },
      _count: true,
      where: {
        createdAt: { gte: startDate }
      }
    });

    const paidCommissions = await prisma.commission.aggregate({
      _sum: { amountCents: true },
      _count: true,
      where: {
        paidAt: { not: null },
        createdAt: { gte: startDate }
      }
    });

    // Referral status breakdown
    const referralsByStatus = await prisma.referral.groupBy({
      by: ['status'],
      _count: true,
      where: {
        createdAt: { gte: startDate }
      }
    });

    const analytics = {
      overview: {
        totalReferrals,
        approvedReferrals,
        conversionRate: conversionRate.toFixed(2),
        totalRevenue: totalCommissions._sum.amountCents || 0,
        totalCommissionsPaid: paidCommissions._sum.amountCents || 0,
        pendingCommissions: (totalCommissions._sum.amountCents || 0) - (paidCommissions._sum.amountCents || 0)
      },
      topAffiliates: topAffiliates.map(affiliate => ({
        id: affiliate.id,
        name: affiliate.user.name,
        email: affiliate.user.email,
        referralCode: affiliate.referralCode,
        totalReferrals: affiliate.referrals.length,
        totalEarnings: affiliate.balanceCents,
        totalCommissions: affiliate.commissions.length
      })),
      referralsByStatus: referralsByStatus.map(item => ({
        status: item.status,
        count: item._count
      })),
      dailyRevenue: dailyRevenue.map(item => ({
        date: item.createdAt,
        amount: item._sum.amountCents || 0
      })),
      commissionStats: {
        total: {
          count: totalCommissions._count,
          amount: totalCommissions._sum.amountCents || 0
        },
        paid: {
          count: paidCommissions._count,
          amount: paidCommissions._sum.amountCents || 0
        },
        pending: {
          count: totalCommissions._count - paidCommissions._count,
          amount: (totalCommissions._sum.amountCents || 0) - (paidCommissions._sum.amountCents || 0)
        }
      }
    };

    return NextResponse.json({
      success: true,
      analytics,
      period: `Last ${days} days`
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}