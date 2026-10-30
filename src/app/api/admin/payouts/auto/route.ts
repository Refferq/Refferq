import { isCodFinanceWriteEnabled } from '@/lib/hv-egypt-finance';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


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
  if (!isCodFinanceWriteEnabled()) {
    return NextResponse.json({ success: false, code: 'COD_FINANCE_NOT_VERIFIED', error: 'Financial writes are disabled until authenticated Shopify COD delivery and collection reconciliation is implemented.' }, { status: 423 });
  }

  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { dryRun = false } = await request.json().catch(() => ({ dryRun: false }));

    // Get program settings for min payout threshold
    const settings = await prisma.programSettings.findFirst();
    const minPayoutCents = settings?.minPayoutCents || 100000; // Default ₹1000

    // Find all affiliates with balance above minimum payout threshold
    // Status check is on User model, not Affiliate
    const eligibleAffiliates = await prisma.affiliate.findMany({
      where: {
        balanceCents: { gte: minPayoutCents },
        user: { status: 'ACTIVE' },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (eligibleAffiliates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No affiliates eligible for auto-payout',
        processed: 0,
        totalAmountCents: 0,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        eligible: eligibleAffiliates.map(a => ({
          id: a.id,
          name: a.user.name,
          email: a.user.email,
          balanceCents: a.balanceCents,
        })),
        totalAffiliates: eligibleAffiliates.length,
        totalAmountCents: eligibleAffiliates.reduce((s, a) => s + a.balanceCents, 0),
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

    for (const affiliate of eligibleAffiliates) {
      try {
        const payoutAmountCents = affiliate.balanceCents;

        // Create payout record
        const payout = await prisma.payout.create({
          data: {
            affiliateId: affiliate.id,
            userId: affiliate.user.id,
            amountCents: payoutAmountCents,
            status: 'PENDING',
            method: 'AUTO',
            notes: 'Auto-payout processed',
            createdBy: admin.id,
          },
        });

        // Reset affiliate balance
        await prisma.affiliate.update({
          where: { id: affiliate.id },
          data: {
            balanceCents: 0,
          },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: 'AUTO_PAYOUT_CREATED',
            actorId: admin.id,
            objectType: 'payout',
            objectId: payout.id,
            payload: {
              affiliateId: affiliate.id,
              amountCents: payoutAmountCents,
            },
          },
        });

        results.push({
          affiliateId: affiliate.id,
          name: affiliate.user.name,
          payoutId: payout.id,
          amountCents: payoutAmountCents,
          status: 'CREATED',
        });

        totalProcessed++;
        totalAmountCents += payoutAmountCents;
      } catch (err) {
        results.push({
          affiliateId: affiliate.id,
          name: affiliate.user.name,
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
