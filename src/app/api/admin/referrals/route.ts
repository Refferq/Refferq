import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asJsonObject, asNumber, asString } from '@/lib/json-utils';


export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Get all referrals with affiliate information
    const referrals = await prisma.referral.findMany({
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
    
    // Get all partner groups for commission rate lookup
    const partnerGroups = await prisma.partnerGroup.findMany();
    const partnerGroupMap = new Map(
      partnerGroups.map(pg => [pg.id, { name: pg.name, rate: pg.commissionRate }])
    );

    return NextResponse.json({
      success: true,
      referrals: referrals.map(referral => {
        const metadata = asJsonObject(referral.metadata);
        const pgId = referral.affiliate.partnerGroupId;
        const pgData = pgId ? partnerGroupMap.get(pgId) : null;
        
        return {
          id: referral.id,
          leadEmail: referral.leadEmail,
          leadName: referral.leadName,
          leadPhone: referral.leadPhone,
          status: referral.status,
          notes: referral.notes,
          createdAt: referral.createdAt,
          estimatedValue: asNumber(metadata.estimated_value, 0),
          company: asString(metadata.company, ''),
          affiliate: {
            id: referral.affiliate.id,
            name: referral.affiliate.user.name,
            email: referral.affiliate.user.email,
            referralCode: referral.affiliate.referralCode,
            partnerGroup: pgData?.name || 'Default',
            partnerGroupId: pgId,
            commissionRate: pgData?.rate || 0.20
          }
        };
      })
    });

  } catch (error) {
    console.error('Admin referrals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { referralIds, action } = body; // action: 'approve' | 'reject'

    if (!referralIds || !Array.isArray(referralIds) || referralIds.length === 0) {
      return NextResponse.json(
        { error: 'Referral IDs array is required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Update multiple referrals
    const updatedReferrals = await prisma.referral.updateMany({
      where: {
        id: { in: referralIds },
        status: 'PENDING'
      },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewedBy: user.id,
        reviewedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${updatedReferrals.count} referrals ${action}d successfully`,
      updatedCount: updatedReferrals.count
    });

  } catch (error) {
    console.error('Batch referral API error:', error);
    return NextResponse.json(
      { error: 'Failed to process referrals' },
      { status: 500 }
    );
  }
}
