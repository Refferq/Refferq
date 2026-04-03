import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

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

function readString(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function readInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value || !value.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(parsed);
}

function readBool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (!value || !value.trim()) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

async function main() {
  loadEnvDefaults();

  const appUrl = readString('NEXT_PUBLIC_SITE_URL', readString('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'));
  const currency = readString('PROGRAM_CURRENCY', 'RUB').toUpperCase();
  const settingsData = {
    programId: readString('PROGRAM_ID', 'prg_main'),
    productName: readString('PROGRAM_PRODUCT_NAME', 'StudioSlow'),
    programName: readString('PROGRAM_NAME', 'StudioSlow Referral Program'),
    websiteUrl: readString('PROGRAM_WEBSITE_URL', appUrl),
    currency,
    portalSubdomain: readString('PROGRAM_PORTAL_SUBDOMAIN', 'affiliate'),
    minimumPayoutThreshold: readInt('PROGRAM_MINIMUM_PAYOUT_THRESHOLD', 0),
    payoutTerm: readString('PROGRAM_PAYOUT_TERM', 'NET-30').toUpperCase(),
    commissionHoldDays: readInt('PROGRAM_HOLD_DAYS', 30),
    minPayoutCents: readInt('PROGRAM_MIN_PAYOUT_CENTS', 100000),
    payoutFrequency: readString('PROGRAM_PAYOUT_FREQUENCY', 'MONTHLY').toUpperCase(),
    autoApprovePayouts: readBool('PROGRAM_AUTO_APPROVE_PAYOUTS', false),
  };

  const existing = await prisma.programSettings.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    console.log('ProgramSettings already exists');
    console.log(`- id: ${existing.id}`);
    console.log(`- programId: ${existing.programId}`);
    return;
  }

  const created = await prisma.programSettings.create({
    data: settingsData,
  });

  console.log('✅ ProgramSettings created');
  console.log(`- id: ${created.id}`);
  console.log(`- programId: ${created.programId}`);
  console.log(`- currency: ${created.currency}`);
  console.log(`- commissionHoldDays: ${created.commissionHoldDays}`);
  console.log(`- minPayoutCents: ${created.minPayoutCents}`);
}

main()
  .catch((error) => {
    console.error('Failed to bootstrap ProgramSettings');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

