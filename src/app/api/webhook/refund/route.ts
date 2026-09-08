import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';
import crypto from 'crypto';

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
 async function POSTHandler(request: NextRequest) {
    try {
        // ─── Authentication ────────────────────────────────────────
        const rawBody = await request.text();
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-refferq-signature');
        const apiKey = request.headers.get('x-api-key');

        let authenticated = false;

        if (apiKey) {
            const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
            const key = await prisma.apiKey.findFirst({
                where: { keyHash, isActive: true },
            }).catch(() => null);
            authenticated = !!key;
        }

        if (!authenticated && webhookSecret && signature) {
            authenticated = verifyWebhookSignature(rawBody, signature, webhookSecret);
        }

        if (!authenticated) {
            return NextResponse.json(
                { success: false, message: __tr("Unauthorized") },
                { status: 401 }
            );
        }

        // ─── Parse & Validate ──────────────────────────────────────
        const body = JSON.parse(rawBody);
        const {
            customer_email,
            referral_code,
            amount_cents,
            reason = __tr("Customer refund"),
            external_id,
        } = body;

        if (!customer_email) {
            return NextResponse.json(
                { success: false, message: __tr("customer_email is required") },
                { status: 400 }
            );
        }

        // ─── Find Related Conversions ──────────────────────────────
        // Strategy: find conversions by customer email in event_metadata
        const conversions = await prisma.conversion.findMany({
            where: {
                eventMetadata: {
                    path: ['customerEmail'],
                    equals: customer_email,
                },
            },
            include: {
                commissions: true,
                affiliate: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (conversions.length === 0) {
            console.log('Refund webhook: no conversions found for', customer_email);
            return NextResponse.json({
                success: true,
                message: __tr("Refund logged (no matching conversion found)"),
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
                            clawbackNote: __tr("Refund: {0}. External ID: {1}", [reason, external_id || 'N/A']),
                        },
                    });

                    results.push({ commissionId: commission.id, action: 'cancelled_pending', amountCents: commission.amountCents });

                } else if (commission.status === 'APPROVED') {
                    // ── Case 2: Already approved (in balance) → cancel + deduct from balance
                    await prisma.commission.update({
                        where: { id: commission.id },
                        data: {
                            status: 'CANCELLED',
                            clawbackNote: __tr("Refund clawback: {0}. External ID: {1}", [reason, external_id || 'N/A']),
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
                            clawbackNote: __tr("Paid commission clawback: {0}. Will be deducted from next payout. External ID: {1}", [reason, external_id || 'N/A']),
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
        await logAuditAction({
            actorId: 'system-webhook',
            action: 'REFUND_PROCESSED',
            objectType: 'REFUND',
            objectId: external_id || `refund-${Date.now()}`,
            payload: {
                customer_email,
                referral_code,
                amount_cents,
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
                        subject: __tr("Commission Reversed — Customer Refund"),
                        body: __tr("A commission has been reversed due to a customer refund. Reason: {0}. This has been reflected in your balance.", [reason]),
                    });
                }
            }
        } catch (emailErr) {
            console.error('Failed to send refund notification emails:', emailErr);
        }

        return NextResponse.json({
            success: true,
            message: __tr("Refund processed: {0} commission(s) reversed", [reversedCount]),
            reversed: reversedCount,
            totalReversedCents,
            details: results,
        });
    } catch (error) {
        console.error('Refund webhook error:', error);
        return NextResponse.json(
            { success: false, message: __tr("Failed to process refund") },
            { status: 500 }
        );
    }
}

export const POST = withSystemLocale(POSTHandler);
