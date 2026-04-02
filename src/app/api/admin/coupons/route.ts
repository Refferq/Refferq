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

// GET: List all coupons
export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST: Create coupon
export async function POST(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { code, description, discountType, discountValue, currency, maxUses, affiliateId, startsAt, expiresAt } = body;

    if (!code || !discountValue) {
      return NextResponse.json({ error: 'Code and discount value are required' }, { status: 400 });
    }

    // Check unique
    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountType: discountType || 'PERCENTAGE',
        discountValue,
        currency: currency || 'RUB',
        maxUses: maxUses || null,
        affiliateId: affiliateId || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('Admin coupons POST error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

// PUT: Update coupon
export async function PUT(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    // Only allow specific fields (prevent mass assignment)
    const allowedFields = ['code', 'description', 'discountType', 'discountValue', 'maxUses', 'isActive', 'expiresAt', 'startsAt', 'minimumAmount'];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.expiresAt) updates.expiresAt = new Date(updates.expiresAt);
    if (updates.startsAt) updates.startsAt = new Date(updates.startsAt);

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('Admin coupons PUT error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE: Delete coupon
export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin coupons DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
