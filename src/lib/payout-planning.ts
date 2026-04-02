export interface ApprovedCommissionLike {
  id: string;
  amountCents: number;
}

export interface AutoPayoutAffiliateLike {
  id: string;
  balanceCents: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  commissions: ApprovedCommissionLike[];
}

export type AutoPayoutSkipReason =
  | 'NO_APPROVED_COMMISSIONS'
  | 'NON_POSITIVE_APPROVED_AMOUNT'
  | 'BELOW_MIN_PAYOUT_THRESHOLD'
  | 'INSUFFICIENT_BALANCE';

export interface AutoPayoutPlanItem {
  affiliateId: string;
  userId: string;
  name: string;
  email: string;
  balanceCents: number;
  approvedAmountCents: number;
  commissionIds: string[];
}

export interface AutoPayoutSkippedItem {
  affiliateId: string;
  name: string;
  email: string;
  balanceCents: number;
  approvedAmountCents: number;
  reason: AutoPayoutSkipReason;
}

export interface AutoPayoutPlanResult {
  payable: AutoPayoutPlanItem[];
  skipped: AutoPayoutSkippedItem[];
}

export function sumApprovedCommissions(commissions: ApprovedCommissionLike[]): number {
  return commissions.reduce((sum, commission) => sum + commission.amountCents, 0);
}

export function buildAutoPayoutPlan(
  affiliates: AutoPayoutAffiliateLike[],
  minPayoutCents: number
): AutoPayoutPlanResult {
  const payable: AutoPayoutPlanItem[] = [];
  const skipped: AutoPayoutSkippedItem[] = [];

  for (const affiliate of affiliates) {
    const commissionIds = affiliate.commissions.map((commission) => commission.id);
    const approvedAmountCents = sumApprovedCommissions(affiliate.commissions);

    const skippedBase = {
      affiliateId: affiliate.id,
      name: affiliate.user.name,
      email: affiliate.user.email,
      balanceCents: affiliate.balanceCents,
      approvedAmountCents,
    };

    if (commissionIds.length === 0) {
      skipped.push({ ...skippedBase, reason: 'NO_APPROVED_COMMISSIONS' });
      continue;
    }

    if (approvedAmountCents <= 0) {
      skipped.push({ ...skippedBase, reason: 'NON_POSITIVE_APPROVED_AMOUNT' });
      continue;
    }

    if (approvedAmountCents < minPayoutCents) {
      skipped.push({ ...skippedBase, reason: 'BELOW_MIN_PAYOUT_THRESHOLD' });
      continue;
    }

    if (affiliate.balanceCents < approvedAmountCents) {
      skipped.push({ ...skippedBase, reason: 'INSUFFICIENT_BALANCE' });
      continue;
    }

    payable.push({
      affiliateId: affiliate.id,
      userId: affiliate.user.id,
      name: affiliate.user.name,
      email: affiliate.user.email,
      balanceCents: affiliate.balanceCents,
      approvedAmountCents,
      commissionIds,
    });
  }

  return { payable, skipped };
}
