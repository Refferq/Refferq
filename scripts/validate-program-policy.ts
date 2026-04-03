import { prisma } from '../src/lib/prisma';
import fs from 'node:fs';
import path from 'node:path';

type Mode = 'report' | 'strict';

function parseDotEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const parsed: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }

  return parsed;
}

function loadEnvDefaults(): void {
  const files = ['.env', '.env.local'].map((name) => path.join(process.cwd(), name));
  for (const file of files) {
    const parsed = parseDotEnvFile(file);
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function readPositiveIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw || !raw.trim()) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
}

async function main() {
  loadEnvDefaults();

  const mode: Mode = process.argv.includes('--strict') ? 'strict' : 'report';
  const expectedCurrency = (process.env.PROGRAM_EXPECTED_CURRENCY || 'RUB').trim().toUpperCase();
  const minHoldDays = readPositiveIntFromEnv('PROGRAM_MIN_HOLD_DAYS', 14);
  const minPayoutCents = readPositiveIntFromEnv('PROGRAM_MIN_PAYOUT_CENTS', 100000);
  const allowAutoApprovePayouts = ['1', 'true', 'yes', 'on'].includes(
    (process.env.PROGRAM_ALLOW_AUTO_APPROVE_PAYOUTS || '').trim().toLowerCase()
  );

  const errors: string[] = [];
  const warnings: string[] = [];

  const settings = await prisma.programSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  console.log('Program policy validation');
  console.log(`Mode: ${mode}`);
  console.log(`Expected currency: ${expectedCurrency}`);
  console.log(`Min hold days: ${minHoldDays}`);
  console.log(`Min payout cents: ${minPayoutCents}`);
  console.log(`Allow auto-approve payouts: ${allowAutoApprovePayouts ? 'yes' : 'no'}`);

  if (!settings) {
    errors.push('ProgramSettings record is missing');
  } else {
    if (settings.currency !== expectedCurrency) {
      errors.push(`currency mismatch: expected ${expectedCurrency}, got ${settings.currency}`);
    }

    if (settings.commissionHoldDays < minHoldDays) {
      errors.push(
        `commissionHoldDays is too low: got ${settings.commissionHoldDays}, expected >= ${minHoldDays}`
      );
    }

    if (settings.minPayoutCents < minPayoutCents) {
      errors.push(
        `minPayoutCents is too low: got ${settings.minPayoutCents}, expected >= ${minPayoutCents}`
      );
    }

    const supportedPayoutFrequencies = new Set([
      'WEEKLY',
      'BIWEEKLY',
      'MONTHLY',
      'QUARTERLY',
      'MANUAL',
    ]);
    if (!supportedPayoutFrequencies.has(settings.payoutFrequency)) {
      warnings.push(
        `payoutFrequency is non-standard: ${settings.payoutFrequency} (allowed: ${Array.from(supportedPayoutFrequencies).join(', ')})`
      );
    }

    if (!allowAutoApprovePayouts && settings.autoApprovePayouts) {
      errors.push('autoApprovePayouts must be disabled for launch policy');
    }
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((error) => console.log(`- ${error}`));
    if (mode === 'strict') process.exit(1);
  }

  if (errors.length === 0) {
    console.log('✅ Program policy looks launch-ready');
  }
}

main()
  .catch((error) => {
    console.error('Program policy validation failed');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
