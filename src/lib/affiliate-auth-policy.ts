import { createHmac } from 'node:crypto';

export function normalizeAffiliateEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function hashOtp(email: string, code: string, key: string): string {
  return createHmac('sha256', key).update(normalizeAffiliateEmail(email) + ':' + code).digest('hex');
}

export function canApproveAffiliate(role: string, verifiedAt: Date | string | null | undefined): boolean {
  return role === 'AFFILIATE' && Boolean(verifiedAt && !Number.isNaN(new Date(verifiedAt).valueOf()));
}
