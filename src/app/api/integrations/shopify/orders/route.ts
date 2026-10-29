import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { normalizeShopifyOrder, verifyShopifyHmac } from '@/lib/hv-cod-connector';

// Only receives Shopify order status snapshots. It never creates or approves
// commissions or changes balances. Enable subscriptions only after credentials
// and domain have been reviewed by Herbal Vitaly.
export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Staging only' }, { status: 423 });
  }
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  if (!secret || !shopDomain) {
    return NextResponse.json({ error: 'Shopify webhook credentials not configured' }, { status: 503 });
  }
  const raw = await request.text();
  const sourceShop = request.headers.get('x-shopify-shop-domain');
  const signature = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic');
  const deliveryId = request.headers.get('x-shopify-webhook-id');
  if (sourceShop !== shopDomain || !verifyShopifyHmac(raw, signature, secret))
    return NextResponse.json({ error: 'Invalid Shopify signature or shop' }, { status: 401 });
  if (!['orders/create', 'orders/updated', 'orders/cancelled'].includes(topic || '') || !deliveryId || deliveryId.length > 128)
    return NextResponse.json({ error: 'Unsupported topic or missing delivery ID' }, { status: 422 });
  try {
    const order = normalizeShopifyOrder(JSON.parse(raw));
    const dedupeKey = 'shopify:' + deliveryId;
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.hvCodOrder.findUnique({ where: { shopifyOrderId: order.shopifyOrderId } });
      await tx.hvCodEvent.create({ data: {
        id: randomUUID(), dedupeKey, source: 'SHOPIFY', orderName: order.orderName,
        state: topic!, occurredAt: order.shopifyUpdatedAt,
      } });
      if (existing && existing.shopifyUpdatedAt >= order.shopifyUpdatedAt) return 'stale';
      const cancelled = topic === 'orders/cancelled' || order.cancelled;
      const changed = existing && (existing.orderTotalPiasters !== order.orderTotalPiasters ||
        existing.subtotalPiasters !== order.subtotalPiasters);
      const record = {
        currency: order.currency, orderName: order.orderName,
        subtotalPiasters: order.subtotalPiasters,
        orderTotalPiasters: order.orderTotalPiasters,
        commissionPreviewPiasters: order.commissionPreviewPiasters,
        isCod: order.isCod, cancelled, refunded: order.refunded,
        referralCode: order.referralCode,
        shopifyUpdatedAt: order.shopifyUpdatedAt,
        merchantReconciled: Boolean(existing?.merchantReconciled) && !changed && !cancelled && !order.refunded,
      };
      if (existing) {
        await tx.hvCodOrder.update({ where: { id: existing.id }, data: record });
      } else {
        await tx.hvCodOrder.create({ data: { id: randomUUID(), shopifyOrderId: order.shopifyOrderId, ...record } });
      }
      return 'stored';
    });
    return NextResponse.json({ success: true, status: result, orderName: order.orderName });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return NextResponse.json({ success: true, status: 'duplicate' });
    console.error('Shopify COD webhook rejected', e instanceof Error ? e.name : 'unknown');
    return NextResponse.json({ error: 'Invalid Shopify order event' }, { status: 422 });
  }
}
