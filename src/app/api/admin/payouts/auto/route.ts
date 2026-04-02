import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildAutoPayoutPlan } from '@/lib/payout-planning';


async function verifyAdmin(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') return null;
    return user;
  } catch (_e) { return null; }
}

// POST - Process auto-payouts for all eligible affiliates
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { dryRun = false } = await request.json().catch(() => ({ dryRun: false }));

    // Get program settings for min payout threshold
    const settings = await prisma.programSettings.findFirst();
    const minPayoutCents = settings?.minPayoutCents || 100000; // Default ₽1000

    // Find active affiliates that have APPROVED commissions, then compute payout plan in code.
    const eligibleAffiliates = await prisma.affiliate.findMany({
      where: {
        user: { status: 'ACTIVE' },
        commissions: {
          some: { status: 'APPROVED' },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, status: true } },
        commissions: {
          where: { status: 'APPROVED' },
          select: { id: true, amountCents: true },
        },
      },
    });
    const payoutPlan = buildAutoPayoutPlan(eligibleAffiliates, minPayoutCents);

    if (payoutPlan.payable.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No affiliates eligible for auto-payout',
        processed: 0,
        totalAmountCents: 0,
        skipped: payoutPlan.skipped,
      });
    }

    if (dryRun) {
      const preview = payoutPlan.payable.map((entry) => {
        return {
          id: entry.affiliateId,
          name: entry.name,
          email: entry.email,
          approvedCommissions: entry.commissionIds.length,
          approvedAmountCents: entry.approvedAmountCents,
          balanceCents: entry.balanceCents,
        };
      });

      return NextResponse.json({
        success: true,
        dryRun: true,
        eligible: preview,
        totalAffiliates: payoutPlan.payable.length,
        totalAmountCents: payoutPlan.payable.reduce((sum, entry) => sum + entry.approvedAmountCents, 0),
        skipped: payoutPlan.skipped,
      });
    }

    // Process payouts
    const results: Array<{
      affiliateId: string;
      name: string;
      payoutId?: string;
      amountCents?: number;
      status: string;
      error?: string;
    }> = [];
    let totalProcessed = 0;
    let totalAmountCents = 0;

    for (const planItem of payoutPlan.payable) {
      try {
        const approvedCommissionIds = planItem.commissionIds;
        const payoutAmountCents = planItem.approvedAmountCents;

        const payout = await prisma.$transaction(async (tx) => {
          const createdPayout = await tx.payout.create({
            data: {
              affiliateId: planItem.affiliateId,
              userId: planItem.userId,
              amountCents: payoutAmountCents,
              commissionCount: approvedCommissionIds.length,
              status: 'PENDING',
              method: 'BANK_TRANSFER',
              notes: 'Auto-payout processed',
              createdBy: admin.id,
            },
          });

          await tx.commission.updateMany({
            where: { id: { in: approvedCommissionIds }, status: 'APPROVED' },
            data: {
              status: 'PAID',
              payoutId: createdPayout.id,
              paidAt: new Date(),
            },
          });

          // Decrement by paid amount instead of blind reset.
          await tx.affiliate.update({
            where: { id: planItem.affiliateId },
            data: {
              balanceCents: { decrement: payoutAmountCents },
            },
          });

          await tx.auditLog.create({
            data: {
              action: 'AUTO_PAYOUT_CREATED',
              actorId: admin.id,
              objectType: 'payout',
              objectId: createdPayout.id,
              payload: {
                affiliateId: planItem.affiliateId,
                balanceCentsBefore: planItem.balanceCents,
                amountCents: payoutAmountCents,
                commissionIds: approvedCommissionIds,
              },
            },
          });

          return createdPayout;
        });

        results.push({
          affiliateId: planItem.affiliateId,
          name: planItem.name,
          payoutId: payout.id,
          amountCents: payoutAmountCents,
          status: 'CREATED',
        });

        totalProcessed++;
        totalAmountCents += payoutAmountCents;
      } catch (err) {
        results.push({
          affiliateId: planItem.affiliateId,
          name: planItem.name,
          status: 'FAILED',
          error: (err as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-payout processed for ${totalProcessed} affiliates`,
      processed: totalProcessed,
      totalAmountCents,
      results,
      skipped: payoutPlan.skipped,
    });
  } catch (error) {
    console.error('Auto-payout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process auto-payouts' }, { status: 500 });
  }
}

// GET - Get auto-payout configuration and status
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const settings = await prisma.programSettings.findFirst();

    // Count eligible affiliates
    const minPayoutCents = settings?.minPayoutCents || 100000;
    const eligibleCount = await prisma.affiliate.count({
      where: {
        balanceCents: { gte: minPayoutCents },
        user: { status: 'ACTIVE' },
      },
    });

    const totalPendingBalance = await prisma.affiliate.aggregate({
      where: {
        balanceCents: { gte: minPayoutCents },
        user: { status: 'ACTIVE' },
      },
      _sum: { balanceCents: true },
    });

    // Recent auto-payouts
    const recentPayouts = await prisma.payout.findMany({
      where: { notes: { contains: 'Auto-payout' } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        affiliate: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        minPayoutCents,
        payoutFrequency: settings?.payoutFrequency || 'MONTHLY',
        autoPayoutsEnabled: settings?.autoApprovePayouts || false,
      },
      stats: {
        eligibleAffiliates: eligibleCount,
        totalPendingCents: totalPendingBalance._sum?.balanceCents || 0,
      },
      recentPayouts,
    });
  } catch (error) {
    console.error('Auto-payout config error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch config' }, { status: 500 });
  }
}
