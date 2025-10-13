import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function POST(request: NextRequest) {
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
      where: { id: payload.userId as string },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { error: 'Access denied. Affiliate role required.' },
        { status: 403 }
      );
    }

    if (!user.affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { lead_name, lead_email, company, notes, estimated_value } = body;

    // Validate required fields
    if (!lead_name || !lead_email) {
      return NextResponse.json(
        { error: 'Lead name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lead_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create the referral
    const referral = await prisma.referral.create({
      data: {
        affiliateId: user.affiliate.id,
        leadName: lead_name.trim(),
        leadEmail: lead_email.toLowerCase().trim(),
        status: 'PENDING',
        metadata: {
          company: company || '',
          notes: notes || '',
          source: 'manual',
          estimated_value: estimated_value || 0,
        },
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Referral submitted successfully',
      referral,
    });
  } catch (error) {
    console.error('Submit referral API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit referral' },
      { status: 500 }
    );
  }
}

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
      where: { id: payload.userId as string },
      include: {
        affiliate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'AFFILIATE') {
      return NextResponse.json(
        { error: 'Access denied. Affiliate role required.' },
        { status: 403 }
      );
    }

    if (!user.affiliate) {
      return NextResponse.json(
        { error: 'Affiliate profile not found' },
        { status: 404 }
      );
    }

    const referrals = await prisma.referral.findMany({
      where: { affiliateId: user.affiliate.id },
      orderBy: { createdAt: 'desc' }
    });

    // Map referrals to include estimatedValue from metadata
    const mappedReferrals = referrals.map(ref => {
      const metadata = ref.metadata as any;
      return {
        ...ref,
        estimatedValue: Number(metadata?.estimated_value) || 0,
        company: metadata?.company || '',
      };
    });

    return NextResponse.json({
      success: true,
      referrals: mappedReferrals,
    });
  } catch (error) {
    console.error('Get referrals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}