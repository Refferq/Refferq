import { NextRequest } from 'next/server';

function parseAllowedOrigins(): string[] {
  const raw = process.env.TRACKING_ALLOWED_ORIGINS || '';
  const values = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (values.length > 0) {
    return values;
  }

  const fallback = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .filter(Boolean)
    .map((url) => {
      try {
        return new URL(url as string).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as string[];

  return [...new Set(fallback)];
}

export function resolveTrackingOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  const allowedOrigins = parseAllowedOrigins();
  if (allowedOrigins.length === 0) return null;

  return allowedOrigins.includes(origin) ? origin : null;
}

export function buildTrackingCorsHeaders(request: NextRequest): Record<string, string> {
  const allowedOrigin = resolveTrackingOrigin(request);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Idempotency-Key',
    Vary: 'Origin',
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  return headers;
}
