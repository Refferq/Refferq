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

// GET: List all resources
 async function GETHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error('Admin resources GET error:', error);
    return NextResponse.json({ error: __tr("Failed to fetch resources") }, { status: 500 });
  }
}

// POST: Create resource
 async function POSTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, type, fileUrl, fileName, fileSize, mimeType, category, tags } = body;

    if (!title || !type || !fileUrl || !fileName) {
      return NextResponse.json({ error: __tr("Title, type, fileUrl, and fileName are required") }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description: description || null,
        type,
        fileUrl,
        fileName,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        category: category || null,
        tags: tags || [],
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('Admin resources POST error:', error);
    return NextResponse.json({ error: __tr("Failed to create resource") }, { status: 500 });
  }
}

// PUT: Update resource
 async function PUTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: __tr("Resource ID required") }, { status: 400 });
    }

    // Only allow specific fields (prevent mass assignment)
    const allowedFields = ['title', 'description', 'url', 'type', 'category', 'isPublished'];
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) updates[key] = body[key];
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('Admin resources PUT error:', error);
    return NextResponse.json({ error: __tr("Failed to update resource") }, { status: 500 });
  }
}

// DELETE: Delete resource
 async function DELETEHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: __tr("Resource ID required") }, { status: 400 });
    }

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin resources DELETE error:', error);
    return NextResponse.json({ error: __tr("Failed to delete resource") }, { status: 500 });
  }
}

export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
export const PUT = withSystemLocale(PUTHandler);
export const DELETE = withSystemLocale(DELETEHandler);
