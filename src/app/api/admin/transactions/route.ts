import { NextRequest, NextResponse } from 'next/server';
import { Prisma, TransactionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const VALID_TRANSACTION_STATUS = new Set<TransactionStatus>([
  'PENDING',
  'COMPLETED',
  'REFUNDED',
  'FAILED',
]);

async function verifyAdmin(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') return null;

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const referralId = searchParams.get('referralId');
    const affiliateId = searchParams.get('affiliateId');

    const where: Prisma.TransactionWhereInput = {};
    if (referralId) where.referralId = referralId;
    if (affiliateId) where.affiliateId = affiliateId;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        referral: true,
        affiliate: {
          include: {
            user: true,
            partnerGroup: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      transactions: transactions.map((txn) => ({
        id: txn.id,
        customerId: txn.customerId,
        customerName: txn.customerName,
        customerEmail: txn.customerEmail,
        amountCents: txn.amountCents,
        commissionCents: txn.commissionCents,
        commissionRate: txn.commissionRate,
        status: txn.status,
        description: txn.description,
        invoiceId: txn.invoiceId,
        paymentMethod: txn.paymentMethod,
        paidAt: txn.paidAt,
        createdAt: txn.createdAt,
        referral: {
          id: txn.referral.id,
          leadName: txn.referral.leadName,
          leadEmail: txn.referral.leadEmail,
          status: txn.referral.status,
        },
        affiliate: {
          id: txn.affiliate.id,
          name: txn.affiliate.user.name,
          email: txn.affiliate.user.email,
          referralCode: txn.affiliate.referralCode,
          partnerGroup: txn.affiliate.partnerGroupId
            ? (txn.affiliate.partnerGroup?.name || 'Default')
            : 'Default',
        },
      })),
    });
  } catch (error) {
    console.error('Get transactions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { referralId, amount, description, invoiceId, paymentMethod, paidAt } = body;

    if (!referralId || typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Referral ID and positive numeric amount are required' },
        { status: 400 }
      );
    }

    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        affiliate: {
          include: {
            user: true,
            partnerGroup: true,
          },
        },
      },
    });

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    const commissionRate = referral.affiliate.partnerGroup?.commissionRate ?? 0.20;
    const amountCents = Math.floor(amount * 100);
    const commissionCents = Math.floor(amountCents * commissionRate);

    const transaction = await prisma.transaction.create({
      data: {
        referralId,
        affiliateId: referral.affiliateId,
        customerId: referral.subscriptionId,
        customerName: referral.leadName,
        customerEmail: referral.leadEmail,
        amountCents,
        commissionCents,
        commissionRate,
        status: 'COMPLETED',
        description,
        invoiceId,
        paymentMethod,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        createdBy: user.id,
      },
    });

    const settings = await prisma.programSettings.findFirst({
      select: { currency: true },
    });

    await prisma.conversion.create({
      data: {
        affiliateId: referral.affiliateId,
        referralId: referral.id,
        eventType: 'PURCHASE',
        amountCents,
        status: 'APPROVED',
        currency: settings?.currency || 'RUB',
        eventMetadata: {
          transactionId: transaction.id,
          commissionCents,
          commissionRate,
        },
      },
    });

    try {
      const { emailService } = await import('@/lib/email');
      await emailService.sendTransactionCreatedEmail(referral.affiliate.user.email, {
        affiliateName: referral.affiliate.user.name || 'Partner',
        customerName: referral.leadName,
        amountCents,
        commissionCents,
        commissionRate,
        transactionId: transaction.id,
      });
    } catch (emailError) {
      console.error('Failed to send transaction email:', emailError);
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction created successfully',
    });
  } catch (error) {
    console.error('Create transaction API error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, description, invoiceId, paymentMethod, paidAt } = body;
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    if (status && !VALID_TRANSACTION_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid transaction status' }, { status: 400 });
    }

    const updateData: Prisma.TransactionUpdateInput = {};
    if (status) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (invoiceId !== undefined) updateData.invoiceId = invoiceId;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (paidAt) updateData.paidAt = new Date(paidAt);

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('Update transaction API error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Delete transaction API error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
