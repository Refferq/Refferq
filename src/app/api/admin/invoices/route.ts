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

// GET: List all invoices
 async function GETHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');

    const where = affiliateId ? { affiliateId } : {};
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('Admin invoices GET error:', error);
    return NextResponse.json({ error: __tr("Failed to fetch invoices") }, { status: 500 });
  }
}

// POST: Create invoice
 async function POSTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { affiliateId, payoutId, amountCents, taxCents, lineItems, billingInfo, notes, dueAt } = body;

    if (!affiliateId || !amountCents) {
      return NextResponse.json({ error: __tr("Affiliate ID and amount are required") }, { status: 400 });
    }

    // Generate invoice number
    const count = await prisma.invoice.count();
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    const tax = taxCents || 0;
    const total = amountCents + tax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        affiliateId,
        payoutId: payoutId || null,
        amountCents,
        taxCents: tax,
        totalCents: total,
        lineItems: lineItems || [{ description: __tr("Affiliate commission payout"), qty: 1, unitPrice: amountCents, total: amountCents }],
        billingInfo: billingInfo || {},
        notes: notes || null,
        status: 'ISSUED',
        issuedAt: new Date(),
        dueAt: dueAt ? new Date(dueAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Admin invoices POST error:', error);
    return NextResponse.json({ error: __tr("Failed to create invoice") }, { status: 500 });
  }
}

// PUT: Update invoice status
 async function PUTHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const body = await request.json();
    const { id, status, paidAt, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: __tr("Invoice ID required") }, { status: 400 });
    }

    const data: any = { ...updates };
    if (status) data.status = status;
    if (status === 'PAID') data.paidAt = paidAt ? new Date(paidAt) : new Date();

    const invoice = await prisma.invoice.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Admin invoices PUT error:', error);
    return NextResponse.json({ error: __tr("Failed to update invoice") }, { status: 500 });
  }
}

// DELETE: Delete invoice (only DRAFT status)
 async function DELETEHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: __tr("Invoice ID required") }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: __tr("Invoice not found") }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: __tr("Cannot delete a paid invoice") }, { status: 400 });
    }

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin invoices DELETE error:', error);
    return NextResponse.json({ error: __tr("Failed to delete invoice") }, { status: 500 });
  }
}

export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
export const PUT = withSystemLocale(PUTHandler);
export const DELETE = withSystemLocale(DELETEHandler);
