import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';

/**
 * POST /api/admin/commissions/mature
 * 
 * Cron/admin endpoint that matures all PENDING commissions whose hold period
 * has expired. Moves them to APPROVED and credits the affiliate balance.
 * 
 * Can be called by:
 * - A cron job (e.g. Vercel Cron, Railway Cron)
 * - Manually by an admin from the dashboard
 */
 async function POSTHandler(request: NextRequest) {
    try {
        // Auth check — must be admin or cron secret
        const cronSecret = request.headers.get('x-cron-secret');
        const userId = request.headers.get('x-user-id');

        let isAuthorized = false;

        // Method 1: Cron secret
        if (cronSecret && cronSecret === process.env.CRON_SECRET) {
            isAuthorized = true;
        }

        // Method 2: Admin user
        if (!isAuthorized && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user?.role === 'ADMIN' && user?.status === 'ACTIVE') {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });
        }

        const now = new Date();

        // Find all PENDING commissions that have matured
        const maturedCommissions = await prisma.commission.findMany({
            where: {
                status: 'PENDING',
                maturesAt: { lte: now },
            },
            include: {
                affiliate: true,
            },
        });

        if (maturedCommissions.length === 0) {
            return NextResponse.json({
                success: true,
                message: __tr("No commissions to mature"),
                matured: 0,
            });
        }

        // Group by affiliate for batch balance updates
        const affiliateUpdates = new Map<string, number>();
        const maturedIds: string[] = [];

        for (const commission of maturedCommissions) {
            maturedIds.push(commission.id);
            const current = affiliateUpdates.get(commission.affiliateId) || 0;
            affiliateUpdates.set(commission.affiliateId, current + commission.amountCents);
        }

        // Batch update: mark all as APPROVED
        await prisma.commission.updateMany({
            where: { id: { in: maturedIds } },
            data: {
                status: 'APPROVED',
                approvedAt: now,
                approvedBy: userId || 'system-cron',
            },
        });

        // Update each affiliate's balance
        for (const [affiliateId, totalCents] of affiliateUpdates.entries()) {
            await prisma.affiliate.update({
                where: { id: affiliateId },
                data: {
                    balanceCents: { increment: totalCents },
                },
            });
        }

        // Log audit
        await logAuditAction({
            actorId: userId || 'system-cron',
            action: 'MATURE_COMMISSIONS',
            objectType: 'COMMISSION',
            objectId: 'batch',
            payload: {
                count: maturedIds.length,
                totalCents: Array.from(affiliateUpdates.values()).reduce((a, b) => a + b, 0),
                affiliateCount: affiliateUpdates.size,
            },
        });

        return NextResponse.json({
            success: true,
            message: __tr("{0} commission(s) matured and approved", [maturedIds.length]),
            matured: maturedIds.length,
            affiliatesUpdated: affiliateUpdates.size,
        });
    } catch (error) {
        console.error('Commission maturation error:', error);
        return NextResponse.json(
            { error: __tr("Failed to mature commissions") },
            { status: 500 }
        );
    }
}

export const POST = withSystemLocale(POSTHandler);
