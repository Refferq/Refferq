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

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Get user from database
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

    // Calculate platform stats
    const totalAffiliates = await prisma.affiliate.count();
    const totalUsers = await prisma.user.count();
    const totalReferrals = await prisma.referral.count();
    const totalConversions = await prisma.conversion.count();
    
    const pendingReferrals = await prisma.referral.count({
      where: { status: 'PENDING' }
    });
    
    const approvedReferrals = await prisma.referral.count({
      where: { status: 'APPROVED' }
    });
    
    // Calculate ACTUAL transaction revenue from conversions
    const totalRevenue = await prisma.conversion.aggregate({
      _sum: { amountCents: true }
    });
    
    // Calculate ESTIMATED revenue from referrals (leads)
    const referrals = await prisma.referral.findMany({
      include: {
        affiliate: true
      }
    });
    
    // Get all partner groups for commission rate lookup
    const partnerGroups = await prisma.partnerGroup.findMany();
    const partnerGroupMap = new Map(
      partnerGroups.map(pg => [pg.id, pg.commissionRate])
    );
    
    let totalEstimatedRevenue = 0;
    let totalEstimatedCommission = 0;
    
    referrals.forEach((ref) => {
      const metadata = ref.metadata as any;
      const estimatedValue = Number(metadata?.estimated_value) || 0;
      const valueInCents = estimatedValue * 100;
      
      // Get commission rate from partner group or default to 20%
      const affiliate = ref.affiliate as any;
      const partnerGroupId = affiliate.partnerGroupId;
      const commissionRate = partnerGroupId 
        ? (partnerGroupMap.get(partnerGroupId) || 0.20)
        : 0.20;
      const commissionInCents = Math.floor(valueInCents * commissionRate);
      
      totalEstimatedRevenue += valueInCents;
      totalEstimatedCommission += commissionInCents;
    });

    const stats = {
      totalAffiliates,
      totalUsers,
      totalReferrals,
      totalConversions,
      pendingReferrals,
      approvedReferrals,
      totalRevenue: totalRevenue._sum?.amountCents || 0, // Actual transaction revenue
      totalEstimatedRevenue, // Estimated revenue from all leads
      totalEstimatedCommission, // Total commission to be paid
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}