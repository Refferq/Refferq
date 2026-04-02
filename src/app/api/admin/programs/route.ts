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

// GET: List all programs
export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const programs = await prisma.program.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, programs });
  } catch (error) {
    console.error('Admin programs GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}

// POST: Create program
export async function POST(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, slug, description, commissionRate, commissionType, cookieDuration, currency, autoApprove, minPayoutCents, payoutFrequency, termsUrl, logoUrl, brandColor } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existing = await prisma.program.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const program = await prisma.program.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        description: description || null,
        commissionRate: commissionRate || 20,
        commissionType: commissionType || 'PERCENTAGE',
        cookieDuration: cookieDuration || 30,
        currency: currency || 'RUB',
        autoApprove: autoApprove || false,
        minPayoutCents: minPayoutCents || 100000,
        payoutFrequency: payoutFrequency || 'MONTHLY',
        termsUrl: termsUrl || null,
        logoUrl: logoUrl || null,
        brandColor: brandColor || '#10b981',
      },
    });

    return NextResponse.json({ success: true, program });
  } catch (error) {
    console.error('Admin programs POST error:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  }
}

// PUT: Update program
export async function PUT(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Program ID required' }, { status: 400 });
    }

    // Only allow specific fields (prevent mass assignment)
    const allowedFields = ['name', 'description', 'commissionType', 'commissionValue', 'cookieDuration', 'isActive', 'terms'];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) updates[key] = body[key];
    }

    const program = await prisma.program.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, program });
  } catch (error) {
    console.error('Admin programs PUT error:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

// DELETE: Delete program
export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Program ID required' }, { status: 400 });
    }

    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin programs DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
