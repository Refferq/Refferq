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

// GET - List saved reports
 async function GETHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const reports = await prisma.savedReport.findMany({
      where: { createdBy: user.id },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Saved reports GET error:', error);
    return NextResponse.json({ error: __tr("Failed to fetch saved reports") }, { status: 500 });
  }
}

// POST - Save a custom report configuration
 async function POSTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { name, description, reportType, columns, filters, sortBy, sortOrder } = body;

    if (!name || !reportType) {
      return NextResponse.json({ error: __tr("Name and reportType are required") }, { status: 400 });
    }

    const report = await prisma.savedReport.create({
      data: {
        name,
        description,
        reportType,
        columns: columns || [],
        filters: filters || {},
        sortBy,
        sortOrder: sortOrder || 'desc',
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Saved reports POST error:', error);
    return NextResponse.json({ error: __tr("Failed to save report") }, { status: 500 });
  }
}

// PUT - Update a saved report
 async function PUTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: __tr("Report ID is required") }, { status: 400 });

    const report = await prisma.savedReport.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Saved reports PUT error:', error);
    return NextResponse.json({ error: __tr("Failed to update report") }, { status: 500 });
  }
}

// DELETE - Remove a saved report
 async function DELETEHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: __tr("Report ID is required") }, { status: 400 });

    await prisma.savedReport.delete({ where: { id } });
    return NextResponse.json({ success: true, message: __tr("Report deleted") });
  } catch (error) {
    console.error('Saved reports DELETE error:', error);
    return NextResponse.json({ error: __tr("Failed to delete report") }, { status: 500 });
  }
}

export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
export const PUT = withSystemLocale(PUTHandler);
export const DELETE = withSystemLocale(DELETEHandler);
