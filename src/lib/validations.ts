
import { t as __tr } from "@/i18n";
import { z } from 'zod';
import { validationMessage } from '@/i18n';

// Include built-in type, range and enum errors, not only custom messages.
z.config({ localeError: (issue) => validationMessage(issue) });

// Referral Validation
export const referralSchema = z.object({
    leadName: z.string().min(2, { error: () => __tr("Name must be at least 2 characters") }),
    leadEmail: z.string().email({ error: () => __tr("Invalid email address") }),
    company: z.string().optional(),
    notes: z.string().optional(),
    estimatedValue: z.number().min(0).max(999999999).optional(),
});

// Affiliate Creation Validation (Admin)
export const affiliateCreateSchema = z.object({
    name: z.string().min(2, { error: () => __tr("Name must be at least 2 characters") }),
    email: z.string().email({ error: () => __tr("Invalid email address") }),
    password: z.string().min(8, { error: () => __tr("Password must be at least 8 characters") }).optional(),
});

// Payout Validation
export const payoutSchema = z.object({
    affiliateId: z.string(),
    commissionIds: z.array(z.string()).min(1, { error: () => __tr("At least one commission is required") }),
    method: z.string().optional(),
    notes: z.string().optional(),
});

// Payout Status Update Validation
export const payoutUpdateSchema = z.object({
    id: z.string(),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
    method: z.string().optional(),
    notes: z.string().optional(),
});

// Program Settings Validation
export const programSettingsSchema = z.object({
    productName: z.string().min(1),
    programName: z.string().min(1),
    websiteUrl: z.string().url(),
    currency: z.string().length(3),
    minPayoutCents: z.number().min(0),
    cookieDuration: z.number().int().min(1),
});
