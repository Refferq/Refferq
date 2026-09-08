
import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and enforce rate limiting for an API key or IP address.
 * Uses a sliding window approach stored in the database.
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute default
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    // Clean up old entries (older than 2 windows)
    await prisma.rateLimitEntry.deleteMany({
      where: {
        windowStart: { lt: new Date(now.getTime() - windowMs * 2) },
      },
    });

    // Count recent requests in the window
    const recentCount = await prisma.rateLimitEntry.aggregate({
      where: {
        identifier,
        endpoint,
        windowStart: { gte: windowStart },
      },
      _sum: { requestCount: true },
    });

    const currentCount = recentCount._sum.requestCount || 0;

    if (currentCount >= maxRequests) {
      const resetAt = new Date(now.getTime() + windowMs);
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetAt,
      };
    }

    // Upsert the current window entry
    const currentWindowStart = new Date(
      Math.floor(now.getTime() / windowMs) * windowMs
    );

    await prisma.rateLimitEntry.upsert({
      where: {
        identifier_endpoint_windowStart: {
          identifier,
          endpoint,
          windowStart: currentWindowStart,
        },
      },
      update: { requestCount: { increment: 1 } },
      create: {
        identifier,
        endpoint,
        windowStart: currentWindowStart,
        requestCount: 1,
      },
    });

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - currentCount - 1,
      resetAt: new Date(currentWindowStart.getTime() + windowMs),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, deny the request (fail closed for security)
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }
}

/**
 * Validate an API key and return the key record if valid.
 * Also checks expiration and active status.
 */
export async function validateApiKey(key: string) {
  try {
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });

    if (!apiKey) return null;
    if (!apiKey.isActive) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return apiKey;
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}

/**
 * Log API usage for analytics.
 */
export async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseMs: number,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.apiUsageLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseMs,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('API usage log error:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}

/**
 * Middleware-style helper to apply rate limiting and API key auth.
 * Returns rate limit headers to include in the response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };
}

/**
 * Create a rate-limited and logged API response.
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const apiKeyHeader = request.headers.get('x-api-key');
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || undefined;
  const endpoint = new URL(request.url).pathname;
  const method = request.method;

  // Determine identifier and rate limit
  let identifier = ipAddress;
  let maxRequests = 30; // Default for unauthenticated
  let apiKeyId: string | null = null;

  if (apiKeyHeader) {
    const apiKey = await validateApiKey(apiKeyHeader);
    if (!apiKey) {
      return NextResponse.json(
        { error: __tr("Invalid or expired API key") },
        { status: 401 }
      );
    }
    identifier = apiKey.id;
    maxRequests = apiKey.rateLimit;
    apiKeyId = apiKey.id;

    // Check scopes
    const scopes = apiKey.scopes as string[];
    if (method !== 'GET' && !scopes.includes('write') && !scopes.includes('admin')) {
      return NextResponse.json(
        { error: __tr("Insufficient API key permissions") },
        { status: 403 }
      );
    }
  }

  // Check rate limit
  const rateResult = await checkRateLimit(identifier, endpoint, maxRequests);

  if (!rateResult.allowed) {
    const response = NextResponse.json(
      { error: __tr("Rate limit exceeded"), retryAfter: rateResult.resetAt.toISOString() },
      { status: 429 }
    );
    const headers = rateLimitHeaders(rateResult);
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));

    // Log the rate-limited request
    if (apiKeyId) {
      await logApiUsage(apiKeyId, endpoint, method, 429, Date.now() - startTime, ipAddress, userAgent);
    }

    return response;
  }

  // Execute the handler
  const response = await handler();
  const responseMs = Date.now() - startTime;

  // Add rate limit headers
  const headers = rateLimitHeaders(rateResult);
  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));

  // Log the request
  if (apiKeyId) {
    await logApiUsage(apiKeyId, endpoint, method, response.status, responseMs, ipAddress, userAgent);
  }

  return response;
}
