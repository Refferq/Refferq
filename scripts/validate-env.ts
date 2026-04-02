import fs from 'node:fs';
import path from 'node:path';

type Mode = 'report' | 'strict';

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'TRACKING_ALLOWED_ORIGINS',
  'WEBHOOK_SECRET',
] as const;

const PLACEHOLDER_PATTERNS = [
  /your-super-secret/i,
  /replace-with/i,
  /^re_x+$/i,
  /^sk_test_\.\.\.$/i,
  /^pk_test_\.\.\.$/i,
  /^whsec_\.\.\.$/i,
];

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

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

function hasEnoughJwtEntropy(jwtSecret: string): boolean {
  return jwtSecret.trim().length >= 32;
}

function main() {
  const mode: Mode = process.argv.includes('--strict') ? 'strict' : 'report';
  const cwd = process.cwd();

  const envFiles = ['.env.local', '.env'].map((name) => path.join(cwd, name));
  const mergedFileEnv = Object.assign(
    {},
    ...envFiles.map((file) => parseDotEnvFile(file))
  );
  const mergedEnv = { ...mergedFileEnv, ...process.env } as Record<string, string | undefined>;

  const missing: string[] = [];
  const placeholder: string[] = [];
  const invalid: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = mergedEnv[key];
    if (!value || !value.trim()) {
      missing.push(key);
      continue;
    }
    if (isPlaceholder(value)) {
      placeholder.push(key);
    }
  }

  const jwt = mergedEnv.JWT_SECRET;
  if (jwt && !hasEnoughJwtEntropy(jwt)) {
    invalid.push('JWT_SECRET (must be >= 32 chars)');
  }

  const appUrl = mergedEnv.NEXT_PUBLIC_APP_URL;
  if (appUrl && !/^https?:\/\//i.test(appUrl)) {
    invalid.push('NEXT_PUBLIC_APP_URL (must include http:// or https://)');
  }

  const allowedOrigins = mergedEnv.TRACKING_ALLOWED_ORIGINS;
  if (allowedOrigins) {
    const origins = allowedOrigins
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (origins.length === 0 || origins.some((origin) => !/^https?:\/\//i.test(origin))) {
      invalid.push('TRACKING_ALLOWED_ORIGINS (comma-separated absolute origins)');
    }
  }

  console.log('Launch env validation');
  console.log(`Mode: ${mode}`);
  console.log(`Checked files: ${envFiles.join(', ')}`);

  if (missing.length === 0 && placeholder.length === 0 && invalid.length === 0) {
    console.log('✅ Environment looks launch-ready');
    process.exit(0);
  }

  if (missing.length > 0) {
    console.log('\nMissing variables:');
    missing.forEach((k) => console.log(`- ${k}`));
  }
  if (placeholder.length > 0) {
    console.log('\nPlaceholder values detected:');
    placeholder.forEach((k) => console.log(`- ${k}`));
  }
  if (invalid.length > 0) {
    console.log('\nInvalid values detected:');
    invalid.forEach((k) => console.log(`- ${k}`));
  }

  if (mode === 'strict') {
    process.exit(1);
  }
}

main();
