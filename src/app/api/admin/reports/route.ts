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

    const url = new URL(request.url);
    const reportType = url.searchParams.get('type') || 'summary';
    const format = url.searchParams.get('format') || 'json';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    let reportData: any = {};

    if (reportType === 'affiliates') {
      // Affiliate Performance Report
      const affiliates = await prisma.affiliate.findMany({
        include: {
          user: true,
          referrals: {
            where: dateFilter
          },
          commissions: {
            where: dateFilter
          }
        }
      });

      reportData = {
        type: 'Affiliate Performance Report',
        generatedAt: new Date().toISOString(),
        data: affiliates.map(affiliate => ({
          affiliateId: affiliate.id,
          name: affiliate.user.name,
          email: affiliate.user.email,
          referralCode: affiliate.referralCode,
          totalReferrals: affiliate.referrals.length,
          approvedReferrals: affiliate.referrals.filter(r => r.status === 'APPROVED').length,
          pendingReferrals: affiliate.referrals.filter(r => r.status === 'PENDING').length,
          totalCommissions: affiliate.commissions.length,
          totalEarnings: affiliate.commissions.reduce((sum, c) => sum + c.amountCents, 0),
          paidEarnings: affiliate.commissions.filter(c => c.paidAt !== null).reduce((sum, c) => sum + c.amountCents, 0),
          balance: affiliate.balanceCents,
          joinedDate: affiliate.createdAt
        }))
      };
    } else if (reportType === 'referrals') {
      // Referrals Report
      const referrals = await prisma.referral.findMany({
        where: dateFilter,
        include: {
          affiliate: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      reportData = {
        type: 'Referrals Report',
        generatedAt: new Date().toISOString(),
        data: referrals.map(referral => ({
          referralId: referral.id,
          leadName: referral.leadName,
          leadEmail: referral.leadEmail,
          leadPhone: referral.leadPhone,
          status: referral.status,
          notes: referral.notes,
          affiliateName: referral.affiliate.user.name,
          affiliateCode: referral.affiliate.referralCode,
          submittedDate: referral.createdAt,
          reviewedDate: referral.reviewedAt,
          reviewedBy: referral.reviewedBy,
          reviewNotes: referral.reviewNotes
        }))
      };
    } else if (reportType === 'commissions') {
      // Commissions Report
      const commissions = await prisma.commission.findMany({
        where: dateFilter,
        include: {
          affiliate: {
            include: {
              user: true
            }
          },
          conversion: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      reportData = {
        type: 'Commissions Report',
        generatedAt: new Date().toISOString(),
        data: commissions.map(commission => ({
          commissionId: commission.id,
          affiliateName: commission.affiliate.user.name,
          affiliateEmail: commission.affiliate.user.email,
          amount: commission.amountCents,
          rate: commission.rate,
          status: commission.status,
          conversionAmount: commission.conversion.amountCents,
          createdDate: commission.createdAt,
          approvedDate: commission.approvedAt,
          paidDate: commission.paidAt
        }))
      };
    } else if (reportType === 'payouts') {
      // Payouts Report
      const payouts = await prisma.payout.findMany({
        where: dateFilter,
        include: {
          user: true,
          commissions: {
            include: {
              affiliate: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      reportData = {
        type: 'Payouts Report',
        generatedAt: new Date().toISOString(),
        data: payouts.map(payout => ({
          payoutId: payout.id,
          affiliateName: payout.user.name,
          affiliateEmail: payout.user.email,
          amount: payout.amountCents,
          method: payout.method,
          status: payout.status,
          requestedDate: payout.createdAt,
          processedDate: payout.processedAt
        }))
      };
    } else {
      // Summary Report (default)
      const totalAffiliates = await prisma.affiliate.count();
      const totalReferrals = await prisma.referral.count({ where: dateFilter });
      const approvedReferrals = await prisma.referral.count({ 
        where: { ...dateFilter, status: 'APPROVED' } 
      });
      const totalCommissions = await prisma.commission.aggregate({
        where: dateFilter,
        _sum: { amountCents: true },
        _count: true
      });
      const totalPayouts = await prisma.payout.aggregate({
        where: dateFilter,
        _sum: { amountCents: true },
        _count: true
      });

      reportData = {
        type: 'Summary Report',
        generatedAt: new Date().toISOString(),
        period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
        summary: {
          totalAffiliates,
          totalReferrals,
          approvedReferrals,
          conversionRate: totalReferrals > 0 ? ((approvedReferrals / totalReferrals) * 100).toFixed(2) : 0,
          totalCommissions: totalCommissions._count,
          totalCommissionAmount: totalCommissions._sum.amountCents || 0,
          totalPayouts: totalPayouts._count,
          totalPayoutAmount: totalPayouts._sum.amountCents || 0
        }
      };
    }

    // Return as CSV if requested
    if (format === 'csv') {
      const csv = convertToCSV(reportData.data || [reportData.summary]);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report-${Date.now()}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}