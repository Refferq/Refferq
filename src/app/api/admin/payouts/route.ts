import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

async function verifyAdmin(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return { error: 'Unauthorized', status: 401 } as const;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
      return { error: 'Forbidden', status: 403 } as const;
    }

    return { user } as const;
  } catch (_err) {
    return { error: 'Authentication internal error', status: 500 } as const;
  }
}

function sanitizeCSVValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  const needsEscape = /^[=+\-@\t\r]/.test(str);
  const escaped = str.replace(/"/g, '""');
  if (needsEscape || str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${needsEscape ? "'" : ''}${escaped}"`;
  }
  return escaped;
}

function convertToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).map((h) => sanitizeCSVValue(h)).join(',');
  const rows = data.map((row) =>
    Object.values(row).map((val) => sanitizeCSVValue(val)).join(',')
  );
  return [headers, ...rows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');

    const where: Prisma.PayoutWhereInput = {};
    if (affiliateId) where.affiliateId = affiliateId;

    const payouts = await prisma.payout.findMany({
      where,
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPayouts = payouts.map((payout) => ({
      id: payout.id,
      affiliateId: payout.affiliateId,
      affiliateName: payout.affiliate.user.name,
      affiliateEmail: payout.affiliate.user.email,
      amountCents: payout.amountCents,
      commissionCount: payout.commissionCount || 0,
      status: payout.status,
      method: payout.method,
      notes: payout.notes,
      createdAt: payout.createdAt,
      processedAt: payout.processedAt,
    }));

    if (searchParams.get('format') === 'csv') {
      const csv = convertToCSV(formattedPayouts);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payouts-${Date.now()}.csv"`,
        },
      });
    }

    const { getCurrencySymbol } = await import('@/lib/currency');
    const currencySymbol = await getCurrencySymbol();

    return NextResponse.json({
      success: true,
      payouts: formattedPayouts,
      currencySymbol,
    });
  } catch (error) {
    console.error('Payouts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { payoutSchema } = await import('@/lib/validations');
    const parsed = payoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { affiliateId, commissionIds, method, notes } = parsed.data;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const commissions = await prisma.commission.findMany({
      where: {
        id: { in: commissionIds },
        affiliateId,
        status: 'APPROVED',
      },
    });

    if (commissions.length === 0) {
      return NextResponse.json({ error: 'No valid (approved) commissions found' }, { status: 404 });
    }

    if (commissions.length !== commissionIds.length) {
      const pendingCount = await prisma.commission.count({
        where: {
          id: { in: commissionIds },
          status: 'PENDING',
        },
      });

      if (pendingCount > 0) {
        return NextResponse.json(
          { error: `${pendingCount} commission(s) are still in the hold period and cannot be paid out yet.` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Some commissions are invalid, cancelled, or already paid.' },
        { status: 400 }
      );
    }

    const totalAmountCents = commissions.reduce((sum, commission) => sum + commission.amountCents, 0);

    const payout = await prisma.payout.create({
      data: {
        affiliateId,
        userId: affiliate.userId,
        amountCents: totalAmountCents,
        commissionCount: commissions.length,
        status: 'PENDING',
        method: method || 'Bank Transfer',
        notes: notes || null,
        createdBy: auth.user.id,
      },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await prisma.commission.updateMany({
      where: {
        id: { in: commissionIds },
        status: 'APPROVED',
      },
      data: {
        status: 'PAID',
        payoutId: payout.id,
        paidAt: new Date(),
      },
    });

    await logAuditAction({
      actorId: auth.user.id,
      action: 'CREATE_PAYOUT',
      objectType: 'PAYOUT',
      objectId: payout.id,
      payload: { amountCents: totalAmountCents, affiliateId },
    });

    try {
      const { emailService } = await import('@/lib/email');
      await emailService.sendPayoutCreatedEmail(affiliate.user.email, {
        affiliateName: payout.affiliate.user.name || 'Partner',
        amountCents: totalAmountCents,
        commissionCount: commissions.length,
        payoutId: payout.id,
        method: method || 'Bank Transfer',
      });
    } catch (emailError) {
      console.error('Failed to send payout created email:', emailError);
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        affiliateId: payout.affiliateId,
        affiliateName: payout.affiliate.user.name,
        affiliateEmail: payout.affiliate.user.email,
        amountCents: payout.amountCents,
        commissionCount: payout.commissionCount,
        status: payout.status,
        method: payout.method,
        notes: payout.notes,
        createdAt: payout.createdAt,
      },
    });
  } catch (error) {
    console.error('Process payouts API error:', error);
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { payoutUpdateSchema } = await import('@/lib/validations');
    const parsed = payoutUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id, status, method, notes } = parsed.data;

    const updateData: Prisma.PayoutUpdateInput = {};
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.processedAt = new Date();
      }
    }
    if (method !== undefined) updateData.method = method;
    if (notes !== undefined) updateData.notes = notes;

    const payout = await prisma.payout.update({
      where: { id },
      data: updateData,
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await logAuditAction({
      actorId: auth.user.id,
      action: 'UPDATE_PAYOUT_STATUS',
      objectType: 'PAYOUT',
      objectId: payout.id,
      payload: { status, method },
    });

    if (status === 'COMPLETED') {
      try {
        const { emailService } = await import('@/lib/email');
        await emailService.sendPayoutCompletedEmail(payout.affiliate.user.email, {
          affiliateName: payout.affiliate.user.name || 'Partner',
          amountCents: payout.amountCents,
          commissionCount: payout.commissionCount,
          payoutId: payout.id,
          method: payout.method || 'Bank Transfer',
          processedAt: payout.processedAt?.toISOString() || new Date().toISOString(),
        });
      } catch (emailError) {
        console.error('Failed to send payout completed email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        affiliateId: payout.affiliateId,
        affiliateName: payout.affiliate.user.name,
        affiliateEmail: payout.affiliate.user.email,
        amountCents: payout.amountCents,
        commissionCount: payout.commissionCount,
        status: payout.status,
        method: payout.method,
        notes: payout.notes,
        createdAt: payout.createdAt,
        processedAt: payout.processedAt,
      },
    });
  } catch (error) {
    console.error('Error updating payout:', error);
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 });
    }

    await prisma.payout.delete({ where: { id } });

    await logAuditAction({
      actorId: auth.user.id,
      action: 'DELETE_PAYOUT',
      objectType: 'PAYOUT',
      objectId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payout deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payout:', error);
    return NextResponse.json({ error: 'Failed to delete payout' }, { status: 500 });
  }
}
