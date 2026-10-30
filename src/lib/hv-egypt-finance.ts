// Herbal Vitaly Egypt financial policy — fail closed until the Shopify/COD
// connector independently authenticates delivery, collection and reconciliation.
export const HV_CURRENCY = 'EGP';
export const HV_COMMISSION_RATE = 20;
export const HV_PAYOUT_FREQUENCY = 'WEEKLY';

export type CodSettlement = {
  delivered: boolean;
  collected: boolean;
  reconciled: boolean;
  refunded: boolean;
  currency: string;
};

export function isEligibleCodSettlement(event: CodSettlement): boolean {
  return event.currency === HV_CURRENCY &&
    event.delivered === true &&
    event.collected === true &&
    event.reconciled === true &&
    event.refunded === false;
}

export function calculateHvCommission(piasters: number, rate = HV_COMMISSION_RATE): number {
  if (!Number.isSafeInteger(piasters) || piasters < 0 ||
      !Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new Error('Invalid commission basis or percentage');
  }
  return Math.round(piasters * rate / 100);
}

// Do not enable money-moving/commission-accrual routes on the strength of
// request metadata alone. A signed Shopify order + validated COD settlement
// and idempotent order-level ledger must be implemented and audited first.
export function isCodFinanceWriteEnabled(): boolean {
  return false;
}
