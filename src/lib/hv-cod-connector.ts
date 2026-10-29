import { createHmac, timingSafeEqual } from 'node:crypto';
import { calculateHvCommission } from './hv-egypt-finance';

export function verifyShopifyHmac(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const actual = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64'), 'utf8');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyBostaKey(provided: string | null, expectedKey: string): boolean {
  if (!provided || !expectedKey) return false;
  const a = Buffer.from(createHmac('sha256', expectedKey).update(provided).digest('hex'));
  const b = Buffer.from(createHmac('sha256', expectedKey).update(expectedKey).digest('hex'));
  return a.length === b.length && timingSafeEqual(a, b);
}

// One piaster is the smallest supported EGP unit. Never use floating-point
// money arithmetic or treat the delivery/merchant remittance as product revenue.
export function egpToPiasters(value: string | number): number {
  const v = String(value);
  if (!/^(0|[1-9]\d{0,10})(?:\.\d{1,2})?$/.test(v)) throw new Error('Invalid EGP amount');
  const [whole, fraction = ''] = v.split('.');
  const piasters = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(piasters)) throw new Error('Amount out of range');
  return piasters;
}

type ShopifyWebhookOrder = {
  id: number | string;
  name: string;
  currency: string;
  current_subtotal_price: string;
  current_total_price: string;
  updated_at: string;
  payment_gateway_names?: string[];
  discount_codes?: Array<{ code?: string }>;
  refunds?: unknown[];
  cancelled_at?: string | null;
  financial_status?: string;
  test?: boolean;
};
export function normalizeShopifyOrder(o: ShopifyWebhookOrder) {
  if (!/^\d+$/.test(String(o.id)) || !o.name || o.name.length > 80) throw new Error('Invalid order identity');
  if (o.currency !== 'EGP') throw new Error('Only EGP orders are supported');
  const updatedAt = new Date(o.updated_at);
  if (Number.isNaN(updatedAt.valueOf())) throw new Error('Missing Shopify update timestamp');
  const gateway = (o.payment_gateway_names || []).join(' ').toLowerCase();
  const isCod = /(cash\s*on\s*delivery|cod|الدفع\s*عند\s*الاستلام)/i.test(gateway);
  const subtotalPiasters = egpToPiasters(o.current_subtotal_price);
  const orderTotalPiasters = egpToPiasters(o.current_total_price);
  if (subtotalPiasters > orderTotalPiasters || orderTotalPiasters === 0) throw new Error('Invalid order totals');
  return {
    shopifyOrderId: String(o.id),
    orderName: o.name,
    currency: 'EGP',
    subtotalPiasters,
    orderTotalPiasters,
    commissionPreviewPiasters: calculateHvCommission(subtotalPiasters),
    isCod,
    referralCode: (o.discount_codes || []).map(x => String(x.code || '').trim()).find(Boolean)?.slice(0, 100) || null,
    cancelled: Boolean(o.cancelled_at),
    refunded: Boolean(o.refunds?.length) || o.financial_status === 'refunded' || o.financial_status === 'partially_refunded',
    shopifyUpdatedAt: updatedAt,
  };
}

export type CodSnapshot = {
  isCod: boolean; delivered: boolean; courierCollected: boolean;
  merchantReconciled: boolean; cancelled: boolean; refunded: boolean;
  orderTotalPiasters: number; collectedPiasters: number; subtotalPiasters: number;
  referralCode?: string | null;
};
export function previewCodCommission(s: CodSnapshot) {
  const eligible = s.isCod && s.delivered && s.courierCollected &&
    s.merchantReconciled && !s.cancelled && !s.refunded &&
    s.orderTotalPiasters > 0 && s.subtotalPiasters > 0 &&
    s.collectedPiasters >= s.orderTotalPiasters && Boolean(s.referralCode);
  return {
    eligibleForManualReview: eligible,
    proposedCommissionPiasters: eligible ? calculateHvCommission(s.subtotalPiasters) : 0,
    ledgerWriteEnabled: false,
    payoutEnabled: false,
  };
}

export function normalizeBostaStatus(o: {
  businessReference?: string; _id?: string; trackingNumber?: string | number;
  state?: number; type?: string; cod?: number; isConfirmedDelivery?: boolean; timeStamp?: number;
}) {
  if (!o.businessReference || !o._id || !o.trackingNumber || !Number.isFinite(o.timeStamp) ||
      typeof o.state !== 'number') throw new Error('Incomplete Bosta status');
  if (!['SEND', 'FXF_SEND'].includes(String(o.type))) throw new Error('Unsupported Bosta delivery type');
  const eventAt = new Date(o.timeStamp!);
  if (Number.isNaN(eventAt.valueOf())) throw new Error('Invalid Bosta timestamp');
  const finalDelivery = o.state === 45 && o.isConfirmedDelivery === true;
  const returnOrCancel = [46,48,49,60,100,101].includes(o.state);
  return {
    orderName: String(o.businessReference),
    deliveryId: String(o._id),
    trackingNumber: String(o.trackingNumber),
    eventAt,
    state: o.state,
    delivered: finalDelivery,
    returned: returnOrCancel,
    collectedPiasters: finalDelivery && Number.isFinite(o.cod) && Number(o.cod) >= 0
      ? egpToPiasters(String(o.cod)) : 0,
  };
}
