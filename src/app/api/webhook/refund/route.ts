import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logSystemAuditAction } from '@/lib/audit';
import crypto from 'crypto';

function toObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return value as Record<string, unknown>;
}

function readOptionalString(
    source: Record<string, unknown>,
    ...keys: string[]
): string | null {
    for (const key of keys) {
        const value = source[key];
        if (typeof value !== 'string') {
            continue;
        }

        const trimmed = value.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }

    return null;
}

// ─── Webhook Signature Verification ────────────────────────────
function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
    if (!signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    try {
        return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
    } catch (_e) {
        return false;
    }
}

/**
 * POST /api/webhook/refund
 * 
 * Receives refund events from payment providers (Stripe, etc.) and
 * automatically reverses or claws back the associated commission.
 * 
 * Expected body:
 * {
 *   customer_email: string,         // Email of the customer who refunded
 *   referral_code?: string,         // Referral code (optional, for faster lookup)
 *   amount_cents: number,           // Refund amount in cents
 *   reason?: string,                // Reason for refund
 *   external_id?: string,           // Payment provider's refund ID
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // ─── Authentication ────────────────────────────────────────
        const rawBody = await request.text();
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-refferq-signature');
        const apiKey = request.headers.get('x-api-key');

        let authenticated = false;
        let authActorUserId: string | null = null;

        if (apiKey) {
            const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
            const key = await prisma.apiKey.findFirst({
                where: { keyHash, isActive: true },
                select: { userId: true },
            }).catch(() => null);
            authenticated = !!key;
            authActorUserId = key?.userId || null;
        }

        if (!authenticated && webhookSecret && signature) {
            authenticated = verifyWebhookSignature(rawBody, signature, webhookSecret);
        }

        if (!authenticated) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // ─── Parse & Validate ──────────────────────────────────────
        const body = toObject(JSON.parse(rawBody));
        const customerEmail = readOptionalString(body, 'customer_email', 'customerEmail');
        const referralCode = readOptionalString(body, 'referral_code', 'referralCode');
        const amountCents =
            typeof body.amount_cents === 'number'
                ? Math.round(body.amount_cents)
                : typeof body.amountCents === 'number'
                    ? Math.round(body.amountCents)
                    : null;
        const reason = readOptionalString(body, 'reason') || 'Customer refund';
        const externalId = readOptionalString(body, 'external_id', 'externalId');

        if (!customerEmail) {
            return NextResponse.json(
                { success: false, message: 'customer_email is required' },
                { status: 400 }
            );
        }

        // Idempotency guard for external refund id
        if (externalId) {
            const alreadyProcessed = await prisma.auditLog.findFirst({
                where: {
                    action: 'REFUND_PROCESSED',
                    objectType: 'REFUND',
                    objectId: String(externalId),
                },
                select: { id: true },
            });

            if (alreadyProcessed) {
                await logSystemAuditAction({
                    preferredActorId: authActorUserId,
                    action: 'refund_duplicate',
                    objectType: 'REFUND',
                    objectId: externalId,
                    payload: {
                        customer_email: customerEmail,
                        reason,
                    },
                });

                return NextResponse.json({
                    success: true,
                    message: 'Duplicate refund event ignored',
                    duplicate: true,
                });
            }
        }

        // ─── Find Related Conversions ──────────────────────────────
        // Strategy: find conversions by customer email in event_metadata
        const conversions = await prisma.conversion.findMany({
            where: {
                eventMetadata: {
                    path: ['customerEmail'],
                    equals: customerEmail,
                },
            },
            include: {
                commissions: true,
                affiliate: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (conversions.length === 0) {
            console.log('Refund webhook: no conversions found for', customerEmail);
            await logSystemAuditAction({
                preferredActorId: authActorUserId,
                action: 'refund_unmatched',
                objectType: 'REFUND',
                objectId: externalId || `refund-${Date.now()}`,
                payload: {
                    customer_email: customerEmail,
                    referral_code: referralCode,
                    amount_cents: amountCents,
                    reason,
                },
            });

            return NextResponse.json({
                success: true,
                message: 'Refund logged (no matching conversion found)',
                reversed: 0,
            });
        }

        // ─── Process Refund for Each Commission ────────────────────
        let reversedCount = 0;
        let totalReversedCents = 0;
        const results: Array<{ commissionId: string; action: string; amountCents: number }> = [];

        for (const conversion of conversions) {
            for (const commission of conversion.commissions) {
                // Skip already cancelled/clawedback commissions
                if (commission.status === 'CANCELLED' || commission.status === 'CLAWBACK') {
                    results.push({ commissionId: commission.id, action: 'already_cancelled', amountCents: 0 });
                    continue;
                }

                if (commission.status === 'PENDING') {
                    // ── Case 1: Still in hold period → simply cancel (no balance impact)
                    await prisma.commission.update({
                        where: { id: commission.id },
                        data: {
                            status: 'CANCELLED',
                            clawbackNote: `Refund: ${reason}. External ID: ${externalId || 'N/A'}`,
                        },
                    });

                    results.push({ commissionId: commission.id, action: 'cancelled_pending', amountCents: commission.amountCents });

                } else if (commission.status === 'APPROVED') {
                    // ── Case 2: Already approved (in balance) → cancel + deduct from balance
                    await prisma.commission.update({
                        where: { id: commission.id },
                        data: {
                            status: 'CANCELLED',
                            clawbackNote: `Refund clawback: ${reason}. External ID: ${externalId || 'N/A'}`,
                        },
                    });

                    // Deduct from affiliate balance
                    await prisma.affiliate.update({
                        where: { id: commission.affiliateId },
                        data: {
                            balanceCents: { decrement: commission.amountCents },
                        },
                    });

                    results.push({ commissionId: commission.id, action: 'clawback_approved', amountCents: commission.amountCents });

                } else if (commission.status === 'PAID') {
                    // ── Case 3: Already paid out → create negative balance (clawback for next payout)
                    await prisma.commission.update({
                        where: { id: commission.id },
                        data: {
                            status: 'CLAWBACK',
                            clawbackNote: `Paid commission clawback: ${reason}. Will be deducted from next payout. External ID: ${externalId || 'N/A'}`,
                        },
                    });

                    // Create negative balance to offset next payout
                    await prisma.affiliate.update({
                        where: { id: commission.affiliateId },
                        data: {
                            balanceCents: { decrement: commission.amountCents },
                        },
                    });

                    results.push({ commissionId: commission.id, action: 'clawback_paid', amountCents: commission.amountCents });
                }

                reversedCount++;
                totalReversedCents += commission.amountCents;
            }

            // Update conversion status
            await prisma.conversion.update({
                where: { id: conversion.id },
                data: { status: 'REJECTED' },
            });
        }

        // ─── Audit Log ─────────────────────────────────────────────
        await logSystemAuditAction({
            preferredActorId: authActorUserId || conversions[0]?.affiliate.userId || null,
            action: 'REFUND_PROCESSED',
            objectType: 'REFUND',
            objectId: externalId || `refund-${Date.now()}`,
            payload: {
                customer_email: customerEmail,
                referral_code: referralCode,
                amount_cents: amountCents,
                reason,
                reversedCount,
                totalReversedCents,
                results,
            },
        });

        // ─── Send email notification to affected affiliates ────────
        try {
            const affectedAffiliateIds = [...new Set(conversions.map(c => c.affiliateId))];
            for (const affId of affectedAffiliateIds) {
                const affiliateUser = await prisma.user.findFirst({
                    where: { affiliate: { id: affId } },
                });
                if (affiliateUser?.email) {
                    const { emailService } = await import('@/lib/email');
                    await emailService.sendGenericEmail(affiliateUser.email, {
                        subject: 'Commission Reversed — Customer Refund',
                        body: `A commission has been reversed due to a customer refund. Reason: ${reason}. This has been reflected in your balance.`,
                    });
                }
            }
        } catch (emailErr) {
            console.error('Failed to send refund notification emails:', emailErr);
        }

        return NextResponse.json({
            success: true,
            message: `Refund processed: ${reversedCount} commission(s) reversed`,
            reversed: reversedCount,
            totalReversedCents,
            details: results,
        });
    } catch (error) {
        console.error('Refund webhook error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process refund' },
            { status: 500 }
        );
    }
}
