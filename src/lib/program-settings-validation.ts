type ProgramSettingsPatch = {
  productName?: string;
  programName?: string;
  websiteUrl?: string;
  currency?: string;
  portalSubdomain?: string;
  minimumPayoutThreshold?: number;
  payoutTerm?: string;
  commissionHoldDays?: number;
  minPayoutCents?: number;
  payoutFrequency?: string;
  autoApprovePayouts?: boolean;
};

export type CommissionRuleType = 'PERCENTAGE' | 'FIXED';

function readOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readOptionalInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }
  return null;
}

function readOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function normalizeCommissionRuleType(value: unknown): CommissionRuleType | null {
  const normalized = readOptionalString(value)?.toUpperCase();
  if (!normalized) return null;
  if (normalized === 'PERCENTAGE') return 'PERCENTAGE';
  if (normalized === 'FIXED' || normalized === 'FLAT') return 'FIXED';
  return null;
}

export function normalizeProgramSettingsPatch(input: unknown): {
  data: ProgramSettingsPatch;
  errors: string[];
} {
  const body = toRecord(input);
  const data: ProgramSettingsPatch = {};
  const errors: string[] = [];

  const productName = readOptionalString(body.productName);
  if (productName !== null) {
    if (productName.length < 1) errors.push('productName must not be empty');
    else data.productName = productName;
  }

  const programName = readOptionalString(body.programName);
  if (programName !== null) {
    if (programName.length < 1) errors.push('programName must not be empty');
    else data.programName = programName;
  }

  const websiteUrl = readOptionalString(body.websiteUrl);
  if (websiteUrl !== null) {
    if (!isValidHttpUrl(websiteUrl)) errors.push('websiteUrl must be an absolute http/https URL');
    else data.websiteUrl = websiteUrl;
  }

  const currency = readOptionalString(body.currency);
  if (currency !== null) {
    const upperCurrency = currency.toUpperCase();
    if (!/^[A-Z]{3}$/.test(upperCurrency)) errors.push('currency must be a 3-letter ISO code');
    else data.currency = upperCurrency;
  }

  const portalSubdomain = readOptionalString(body.portalSubdomain);
  if (portalSubdomain !== null) {
    data.portalSubdomain = portalSubdomain;
  }

  const minimumPayoutThresholdRaw = body.minimumPayoutThreshold ?? body.minimumPayout;
  if (minimumPayoutThresholdRaw !== undefined) {
    const minimumPayoutThreshold = readOptionalInteger(minimumPayoutThresholdRaw);
    if (minimumPayoutThreshold === null || minimumPayoutThreshold < 0) {
      errors.push('minimumPayoutThreshold must be a non-negative integer');
    } else {
      data.minimumPayoutThreshold = minimumPayoutThreshold;
    }
  }

  const payoutTerm = readOptionalString(body.payoutTerm);
  if (payoutTerm !== null) {
    data.payoutTerm = payoutTerm.toUpperCase();
  }

  if (body.commissionHoldDays !== undefined) {
    const commissionHoldDays = readOptionalInteger(body.commissionHoldDays);
    if (commissionHoldDays === null || commissionHoldDays < 0 || commissionHoldDays > 365) {
      errors.push('commissionHoldDays must be an integer between 0 and 365');
    } else {
      data.commissionHoldDays = commissionHoldDays;
    }
  }

  if (body.minPayoutCents !== undefined) {
    const minPayoutCents = readOptionalInteger(body.minPayoutCents);
    if (minPayoutCents === null || minPayoutCents < 0) {
      errors.push('minPayoutCents must be a non-negative integer');
    } else {
      data.minPayoutCents = minPayoutCents;
    }
  }

  // Keep both payout threshold fields aligned to avoid UI/API drift:
  // - legacy `minimumPayoutThreshold`
  // - operational `minPayoutCents` used by auto-payout flow
  if (data.minimumPayoutThreshold !== undefined && data.minPayoutCents === undefined) {
    data.minPayoutCents = data.minimumPayoutThreshold;
  }
  if (data.minPayoutCents !== undefined && data.minimumPayoutThreshold === undefined) {
    data.minimumPayoutThreshold = data.minPayoutCents;
  }

  const payoutFrequency = readOptionalString(body.payoutFrequency);
  if (payoutFrequency !== null) {
    data.payoutFrequency = payoutFrequency.toUpperCase();
  }

  const autoApprovePayoutsRaw = body.autoApprovePayouts ?? body.autoApprove;
  if (autoApprovePayoutsRaw !== undefined) {
    const autoApprovePayouts = readOptionalBoolean(autoApprovePayoutsRaw);
    if (autoApprovePayouts === null) {
      errors.push('autoApprovePayouts must be a boolean');
    } else {
      data.autoApprovePayouts = autoApprovePayouts;
    }
  }

  return { data, errors };
}
