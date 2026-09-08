import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

 async function GETHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    // Get user from database

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Access denied. Admin role required.") },
        { status: 403 }
      );
    }

    // Fetch all affiliates with their user info and counts
    const affiliates = await prisma.affiliate.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            referrals: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get currency symbol
    const { getCurrencySymbol } = await import('@/lib/currency');
    const currencySymbol = await getCurrencySymbol();

    return NextResponse.json({
      success: true,
      affiliates,
      currencySymbol, // Add currency symbol to response
    });
  } catch (error) {
    console.error('Get affiliates API error:', error);
    return NextResponse.json(
      { error: __tr("Failed to fetch affiliates") },
      { status: 500 }
    );
  }
}

 async function POSTHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    // Get user from database

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Access denied. Admin role required.") },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate with Zod
    const { success, data, error: validationError } = await import('@/lib/validations').then(m => m.affiliateCreateSchema.safeParse(body));

    if (!success) {
      return NextResponse.json(
        { error: __tr("Validation failed"), details: validationError.issues },
        { status: 400 }
      );
    }

    const { name, email, password } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: __tr("User with this email already exists") },
        { status: 400 }
      );
    }

    // Generate password if not provided
    const crypto = await import('crypto');
    const userPassword = password || `AF${crypto.randomBytes(12).toString('base64url')}`;

    // Hash password with bcrypt
    const hashedPassword = await (await import('bcryptjs')).hash(userPassword, 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: 'AFFILIATE',
        status: 'ACTIVE',
        password: hashedPassword
      }
    });

    // Create affiliate profile
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: newUser.id,
        referralCode: `AF${Date.now()}${(await import('crypto')).randomBytes(3).toString('hex').toUpperCase().slice(0, 4)}`,
        balanceCents: 0,
        payoutDetails: {}
      }
    });

    return NextResponse.json({
      success: true,
      message: __tr("Affiliate created successfully"),
      affiliate: {
        id: affiliate.id,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        referralCode: affiliate.referralCode,
        balanceCents: affiliate.balanceCents,
        createdAt: affiliate.createdAt
      },
      // Note: Password is sent to admin once and should be communicated
      // securely to the affiliate. It is not stored in logs.
      temporaryPassword: userPassword
    });
  } catch (error) {
    console.error('Create affiliate API error:', error);
    return NextResponse.json(
      { error: __tr("Failed to create affiliate") },
      { status: 500 }
    );
  }
}
export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
