import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as any;

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');

    // Build where clause
    const where: any = {};
    if (affiliateId) {
      where.affiliateId = affiliateId;
    }

    // Fetch payouts from database
    const payouts = await (prisma as any).payout.findMany({
      where,
      include: {
        affiliate: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedPayouts = payouts.map((payout: any) => ({
      id: payout.id,
      affiliateId: payout.affiliateId,
      affiliateName: payout.affiliate.name,
      affiliateEmail: payout.affiliate.email,
      amountCents: payout.amountCents,
      commissionCount: payout.commissionCount || 0,
      status: payout.status,
      method: payout.method,
      notes: payout.notes,
      createdAt: payout.createdAt,
      processedAt: payout.processedAt,
    }));

    return NextResponse.json({
      success: true,
      payouts: formattedPayouts,
    });

  } catch (error: any) {
    console.error('Payouts API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as any;

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { affiliateId, commissionIds, method, notes } = body;

    if (!affiliateId) {
      return NextResponse.json({ error: 'Affiliate ID is required' }, { status: 400 });
    }

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json({ error: 'At least one commission is required' }, { status: 400 });
    }

    // Verify affiliate exists
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    // Fetch transactions for these commission IDs (only COMPLETED transactions)
    const transactions = await (prisma as any).transaction.findMany({
      where: {
        id: { in: commissionIds },
        affiliateId: affiliateId,
        status: 'COMPLETED',
      },
    });

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No valid commissions found' }, { status: 404 });
    }

    if (transactions.length !== commissionIds.length) {
      return NextResponse.json(
        { error: 'Some commissions are invalid or not eligible for payout' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmountCents = transactions.reduce(
      (sum: number, txn: any) => sum + txn.commissionCents,
      0
    );

    // Create payout record
    const payout = await (prisma as any).payout.create({
      data: {
        affiliateId,
        amountCents: totalAmountCents,
        commissionCount: transactions.length,
        status: 'PENDING',
        method: method || 'Bank Transfer',
        notes: notes || null,
        createdBy: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        affiliate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update transactions to mark commissions as paid
    await (prisma as any).transaction.updateMany({
      where: {
        id: { in: commissionIds },
      },
      data: {
        status: 'PAID',
        updatedAt: new Date(),
      },
    });

    // Send email notification to affiliate
    try {
      const affiliateUser = await prisma.user.findFirst({
        where: { 
          affiliate: { id: affiliateId }
        }
      });

      if (affiliateUser?.email) {
        const { emailService } = await import('@/lib/email');
        await emailService.sendPayoutCreatedEmail(affiliateUser.email, {
          affiliateName: payout.affiliate.name || affiliateUser.name || 'Partner',
          amountCents: totalAmountCents,
          commissionCount: transactions.length,
          payoutId: payout.id,
          method: method || 'Bank Transfer'
        });
      }
    } catch (emailError) {
      console.error('Failed to send payout created email:', emailError);
      // Don't fail the payout if email fails
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        affiliateId: payout.affiliateId,
        affiliateName: payout.affiliate.name,
        affiliateEmail: payout.affiliate.email,
        amountCents: payout.amountCents,
        commissionCount: payout.commissionCount,
        status: payout.status,
        method: payout.method,
        notes: payout.notes,
        createdAt: payout.createdAt,
      },
    });

  } catch (error: any) {
    console.error('Process payouts API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payout' },
      { status: 500 }
    );
  }
}

// PUT - Update payout status
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as any;

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, method, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.processedAt = new Date();
      }
    }
    if (method !== undefined) updateData.method = method;
    if (notes !== undefined) updateData.notes = notes;

    // Update payout
    const payout = await (prisma as any).payout.update({
      where: { id },
      data: updateData,
      include: {
        affiliate: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Send email notification if status changed to COMPLETED
    if (status === 'COMPLETED') {
      try {
        const affiliateUser = await prisma.user.findFirst({
          where: { 
            affiliate: { id: payout.affiliateId }
          }
        });

        if (affiliateUser?.email) {
          const { emailService } = await import('@/lib/email');
          await emailService.sendPayoutCompletedEmail(affiliateUser.email, {
            affiliateName: payout.affiliate.name || affiliateUser.name || 'Partner',
            amountCents: payout.amountCents,
            commissionCount: payout.commissionCount,
            payoutId: payout.id,
            method: payout.method || 'Bank Transfer',
            processedAt: payout.processedAt?.toISOString() || new Date().toISOString()
          });
        }
      } catch (emailError) {
        console.error('Failed to send payout completed email:', emailError);
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        affiliateId: payout.affiliateId,
        affiliateName: payout.affiliate.name,
        affiliateEmail: payout.affiliate.email,
        amountCents: payout.amountCents,
        commissionCount: payout.commissionCount,
        status: payout.status,
        method: payout.method,
        notes: payout.notes,
        createdAt: payout.createdAt,
        processedAt: payout.processedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating payout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payout' },
      { status: 500 }
    );
  }
}

// DELETE - Delete payout
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as any;

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 });
    }

    // Delete payout
    await (prisma as any).payout.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Payout deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting payout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete payout' },
      { status: 500 }
    );
  }
}
