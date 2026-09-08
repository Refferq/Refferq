import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
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

// GET: List team members
 async function GETHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('Admin team GET error:', error);
    return NextResponse.json({ error: __tr("Failed to fetch team members") }, { status: 500 });
  }
}

// POST: Invite team member
 async function POSTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { email, name, role, permissions } = body;

    if (!email || !name) {
      return NextResponse.json({ error: __tr("Email and name are required") }, { status: 400 });
    }

    // Check if already invited
    const existing = await prisma.teamMember.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: __tr("This email has already been invited") }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: {
        email: email.toLowerCase(),
        name,
        role: role || 'VIEWER',
        permissions: permissions || [],
        invitedBy: user.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Admin team POST error:', error);
    return NextResponse.json({ error: __tr("Failed to invite team member") }, { status: 500 });
  }
}

// PUT: Update team member
 async function PUTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: __tr("Team member ID required") }, { status: 400 });
    }

    // Only allow specific fields (prevent mass assignment)
    const allowedFields = ['name', 'email', 'role', 'permissions', 'isActive'];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) updates[key] = body[key];
    }

    const member = await prisma.teamMember.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Admin team PUT error:', error);
    return NextResponse.json({ error: __tr("Failed to update team member") }, { status: 500 });
  }
}

// DELETE: Remove team member
 async function DELETEHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: __tr("Team member ID required") }, { status: 400 });
    }

    await prisma.teamMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin team DELETE error:', error);
    return NextResponse.json({ error: __tr("Failed to delete team member") }, { status: 500 });
  }
}

export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
export const PUT = withSystemLocale(PUTHandler);
export const DELETE = withSystemLocale(DELETEHandler);
