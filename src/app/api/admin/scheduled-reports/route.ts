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

// GET - List all scheduled reports
 async function GETHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const reports = await prisma.scheduledReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Scheduled reports GET error:', error);
    return NextResponse.json({ error: __tr("Failed to fetch scheduled reports") }, { status: 500 });
  }
}

// POST - Create a new scheduled report
 async function POSTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { name, reportType, frequency, recipients, filters, format } = body;

    if (!name || !reportType || !frequency) {
      return NextResponse.json({ error: __tr("Name, reportType, and frequency are required") }, { status: 400 });
    }

    // Calculate next run time
    const nextRunAt = calculateNextRun(frequency);

    const report = await prisma.scheduledReport.create({
      data: {
        name,
        reportType,
        frequency,
        recipients: recipients || [],
        filters: filters || {},
        format: format || 'csv',
        nextRunAt,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Scheduled reports POST error:', error);
    return NextResponse.json({ error: __tr("Failed to create scheduled report") }, { status: 500 });
  }
}

// PUT - Update a scheduled report
 async function PUTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: __tr("Report ID is required") }, { status: 400 });

    // Recalculate next run if frequency changed
    if (updates.frequency) {
      updates.nextRunAt = calculateNextRun(updates.frequency);
    }

    const report = await prisma.scheduledReport.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Scheduled reports PUT error:', error);
    return NextResponse.json({ error: __tr("Failed to update scheduled report") }, { status: 500 });
  }
}

// DELETE - Remove a scheduled report
 async function DELETEHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: __tr("Report ID is required") }, { status: 400 });

    await prisma.scheduledReport.delete({ where: { id } });
    return NextResponse.json({ success: true, message: __tr("Scheduled report deleted") });
  } catch (error) {
    console.error('Scheduled reports DELETE error:', error);
    return NextResponse.json({ error: __tr("Failed to delete scheduled report") }, { status: 500 });
  }
}

function calculateNextRun(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case 'DAILY':
      now.setDate(now.getDate() + 1);
      now.setHours(8, 0, 0, 0);
      break;
    case 'WEEKLY':
      now.setDate(now.getDate() + (7 - now.getDay() + 1)); // Next Monday
      now.setHours(8, 0, 0, 0);
      break;
    case 'BIWEEKLY':
      now.setDate(now.getDate() + 14);
      now.setHours(8, 0, 0, 0);
      break;
    case 'MONTHLY':
      now.setMonth(now.getMonth() + 1, 1); // 1st of next month
      now.setHours(8, 0, 0, 0);
      break;
    default:
      now.setDate(now.getDate() + 7);
      now.setHours(8, 0, 0, 0);
  }
  return now;
}

export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
export const PUT = withSystemLocale(PUTHandler);
export const DELETE = withSystemLocale(DELETEHandler);
