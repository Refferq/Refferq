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

/**
 * A first administrator can request an OTP only when Preview onboarding
 * has been explicitly enabled, there are no administrators yet, and the
 * requested address is listed in the project's private ADMIN_EMAILS setting.
 */
export function canBootstrapFirstAdmin(input: {
  email: string; allowlist: string; environment: string | undefined;
  enabled: string | undefined; existingAdminCount: number;
}): boolean {
  return input.environment === 'preview' &&
    input.enabled === 'true' &&
    input.existingAdminCount === 0 &&
    input.allowlist.split(',').map(normalizeAffiliateEmail).filter(Boolean)
      .includes(normalizeAffiliateEmail(input.email));
}
