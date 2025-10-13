import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

// GET - Fetch all transactions (Admin only)
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const referralId = searchParams.get('referralId');
    const affiliateId = searchParams.get('affiliateId');

    // Build where clause
    const where: any = {};
    if (referralId) where.referralId = referralId;
    if (affiliateId) where.affiliateId = affiliateId;

    const transactions = await (prisma as any).transaction.findMany({
      where,
      include: {
        referral: true,
        affiliate: {
          include: {
            user: true,
            partnerGroup: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      transactions: transactions.map((txn: any) => {
        const affiliate = txn.affiliate as any;
        return {
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
            status: txn.referral.status
          },
          affiliate: {
            id: affiliate.id,
            name: affiliate.user.name,
            email: affiliate.user.email,
            referralCode: affiliate.referralCode,
            partnerGroup: affiliate.partnerGroupId ? 
              (affiliate.partnerGroup?.name || 'Default') : 
              'Default'
          }
        };
      })
    });

  } catch (error) {
    console.error('Get transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST - Create new transaction
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      referralId,
      amount,
      description,
      invoiceId,
      paymentMethod,
      paidAt
    } = body;

    // Validate required fields
    if (!referralId || !amount) {
      return NextResponse.json(
        { error: 'Referral ID and amount are required' },
        { status: 400 }
      );
    }

    // Get referral with affiliate and partner group
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        affiliate: true
      }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    // Get partner group commission rate
    const affiliate = referral.affiliate as any;
    let commissionRate = 0.20; // Default 20%

    if (affiliate.partnerGroupId) {
      const partnerGroup = await prisma.partnerGroup.findUnique({
        where: { id: affiliate.partnerGroupId }
      });
      if (partnerGroup) {
        commissionRate = partnerGroup.commissionRate;
      }
    }

    // Calculate commission
    const amountCents = Math.floor(Number(amount) * 100);
    const commissionCents = Math.floor(amountCents * commissionRate);

    // Create transaction
    const transaction = await (prisma as any).transaction.create({
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
        createdBy: user.id
      }
    });

    // Also create a commission record for tracking
    await prisma.conversion.create({
      data: {
        affiliateId: referral.affiliateId,
        referralId: referral.id,
        eventType: 'PURCHASE',
        amountCents,
        status: 'APPROVED',
        currency: 'INR',
        eventMetadata: {
          transactionId: transaction.id,
          commissionCents,
          commissionRate
        }
      }
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction created successfully'
    });

  } catch (error) {
    console.error('Create transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

// PUT - Update transaction
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      id,
      status,
      description,
      invoiceId,
      paymentMethod,
      paidAt
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await (prisma as any).transaction.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(description !== undefined && { description }),
        ...(invoiceId !== undefined && { invoiceId }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(paidAt && { paidAt: new Date(paidAt) })
      }
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction updated successfully'
    });

  } catch (error) {
    console.error('Update transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE - Delete transaction
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    await (prisma as any).transaction.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
