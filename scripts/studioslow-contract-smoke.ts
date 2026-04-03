type JsonValue = Record<string, unknown>;

import fs from 'node:fs';
import path from 'node:path';

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
  const cwd = process.cwd();
  const files = ['.env', '.env.local'].map((name) => path.join(cwd, name));
  for (const file of files) {
    const parsed = parseDotEnvFile(file);
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

async function postJson(
  url: string,
  body: JsonValue,
  headers: Record<string, string>
): Promise<{ status: number; json: any }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function main() {
  loadEnvDefaults();

  const baseUrl = requireEnv('STAGING_BASE_URL').replace(/\/$/, '');
  const trackingApiKey = requireEnv('STAGING_TRACKING_API_KEY');
  const referralCode = requireEnv('STAGING_REFERRAL_CODE');
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  console.log('StudioSlow contract smoke started');
  console.log(`Base URL: ${baseUrl}`);

  const missingIdsPayload = {
    referralCode,
    customerEmail: `contract_missing_ids_${suffix}@example.com`,
    customerName: 'Contract Smoke Missing IDs',
    amount: 990,
    currency: 'RUB',
    metadata: {
      source: 'studioslow-contract-smoke',
      runId: suffix,
    },
  };

  const missingIdsResult = await postJson(
    `${baseUrl}/api/track/conversion`,
    missingIdsPayload,
    { 'x-api-key': trackingApiKey }
  );

  if (
    missingIdsResult.status !== 400 ||
    !String(missingIdsResult.json?.error || '').toLowerCase().includes('correlation identifier')
  ) {
    throw new Error(
      `Expected 400 correlation-id rejection. got status=${missingIdsResult.status}, body=${JSON.stringify(missingIdsResult.json)}`
    );
  }
  console.log('✓ Missing correlation identifiers rejected as expected');

  const orderId = `smoke_ord_${suffix}`;
  const eventId = `smoke_evt_${suffix}`;
  const validPayload = {
    referralCode,
    customerEmail: `contract_valid_${suffix}@example.com`,
    customerName: 'Contract Smoke Valid',
    amount: 1490,
    currency: 'RUB',
    orderId,
    eventId,
    occurredAt: new Date().toISOString(),
    metadata: {
      source: 'studioslow-contract-smoke',
      runId: suffix,
    },
  };

  const first = await postJson(
    `${baseUrl}/api/track/conversion`,
    validPayload,
    { 'x-api-key': trackingApiKey }
  );

  if (first.status !== 200 || first.json?.success !== true) {
    throw new Error(`Valid conversion failed: status=${first.status}, body=${JSON.stringify(first.json)}`);
  }
  console.log('✓ Valid conversion accepted');

  const duplicate = await postJson(
    `${baseUrl}/api/track/conversion`,
    validPayload,
    { 'x-api-key': trackingApiKey }
  );

  if (duplicate.status !== 200 || duplicate.json?.idempotent !== true) {
    throw new Error(
      `Duplicate conversion idempotency failed: status=${duplicate.status}, body=${JSON.stringify(duplicate.json)}`
    );
  }
  console.log('✓ Duplicate conversion handled idempotently');

  console.log('✅ StudioSlow contract smoke completed successfully');
}

main().catch((error) => {
  console.error('❌ StudioSlow contract smoke failed');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
