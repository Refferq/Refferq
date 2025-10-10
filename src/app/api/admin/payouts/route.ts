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

    // Get all approved commissions that haven't been paid
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        status: 'APPROVED',
        paidAt: null
      },
      include: {
        affiliate: {
          include: {
            user: true
          }
        },
        conversion: true
      }
    });

    // Group by affiliate
    const commissionsByAffiliate = pendingCommissions.reduce((acc: any, commission) => {
      const affiliateId = commission.affiliateId;
      if (!acc[affiliateId]) {
        acc[affiliateId] = {
          affiliate: {
            id: commission.affiliate.id,
            name: commission.affiliate.user.name,
            email: commission.affiliate.user.email,
            referralCode: commission.affiliate.referralCode
          },
          commissions: [],
          totalAmount: 0
        };
      }
      acc[affiliateId].commissions.push(commission);
      acc[affiliateId].totalAmount += commission.amountCents;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      payouts: Object.values(commissionsByAffiliate)
    });

  } catch (error) {
    console.error('Payouts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { affiliateIds } = body; // Array of affiliate IDs to process payouts for

    if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
      return NextResponse.json(
        { error: 'Affiliate IDs array is required' },
        { status: 400 }
      );
    }

    const processedPayouts = [];

    for (const affiliateId of affiliateIds) {
      // Get all approved, unpaid commissions for this affiliate
      const commissions = await prisma.commission.findMany({
        where: {
          affiliateId: affiliateId,
          status: 'APPROVED',
          paidAt: null
        }
      });

      if (commissions.length === 0) continue;

      // Calculate total payout amount
      const totalAmount = commissions.reduce((sum, c) => sum + c.amountCents, 0);

      // Create payout record
      const payout = await prisma.payout.create({
        data: {
          userId: commissions[0].userId,
          commissionId: commissions[0].id,
          amountCents: totalAmount,
          method: 'BANK_TRANSFER',
          status: 'PENDING'
        }
      });

      // Mark all commissions as paid
      await prisma.commission.updateMany({
        where: {
          id: { in: commissions.map(c => c.id) }
        },
        data: {
          paidAt: new Date()
        }
      });

      // Update affiliate balance
      await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          balanceCents: {
            increment: totalAmount
          }
        }
      });

      processedPayouts.push({
        affiliateId,
        payoutId: payout.id,
        amount: totalAmount,
        commissionCount: commissions.length
      });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedPayouts.length} payouts successfully`,
      payouts: processedPayouts
    });

  } catch (error) {
    console.error('Process payouts API error:', error);
    return NextResponse.json(
      { error: 'Failed to process payouts' },
      { status: 500 }
    );
  }
}