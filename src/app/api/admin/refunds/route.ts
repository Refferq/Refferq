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

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { transactionId, reason } = await request.json();
    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { affiliate: true },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }
    if (transaction.status === 'REFUNDED') {
      return NextResponse.json({ success: false, error: 'Transaction already refunded' }, { status: 400 });
    }

    const commissions = await prisma.commission.findMany({
      where: {
        affiliateId: transaction.affiliateId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = {
      transactionRefunded: false,
      commissionReversed: false,
      balanceDeducted: false,
      reversedCommissionId: null as string | null,
      reversedAmountCents: 0,
      deductedAmountCents: 0,
    };

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'REFUNDED',
          description: `${transaction.description || ''} [REFUNDED: ${reason || 'No reason provided'}]`.trim(),
        },
      });
      results.transactionRefunded = true;

      if (commissions.length === 0) {
        return;
      }

      const matchingCommission = commissions[0];
      await tx.commission.update({
        where: { id: matchingCommission.id },
        data: { status: 'CANCELLED' },
      });
      results.commissionReversed = true;
      results.reversedCommissionId = matchingCommission.id;
      results.reversedAmountCents = matchingCommission.amountCents;

      const affiliate = await tx.affiliate.findUnique({
        where: { id: transaction.affiliateId },
      });
      if (affiliate && affiliate.balanceCents >= matchingCommission.amountCents) {
        await tx.affiliate.update({
          where: { id: transaction.affiliateId },
          data: {
            balanceCents: { decrement: matchingCommission.amountCents },
          },
        });
        results.balanceDeducted = true;
        results.deductedAmountCents = matchingCommission.amountCents;
      }

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'TRANSACTION_REFUNDED',
          objectType: 'transaction',
          objectId: transactionId,
          payload: {
            reason: reason || 'No reason provided',
            transactionAmountCents: transaction.amountCents,
            commissionReversed: results.commissionReversed,
            reversedAmountCents: results.reversedAmountCents,
            balanceDeducted: results.balanceDeducted,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      results,
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process refund' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: 'REFUNDED' },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Failed to fetch refunded transactions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch refunds' }, { status: 500 });
  }
}
