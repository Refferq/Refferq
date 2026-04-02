import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type TrackingApiKeyValidation = {
  valid: boolean;
  source: 'api_keys' | 'integration_settings' | 'none';
  apiKeyId?: string;
  userId?: string;
};

/**
 * Validates x-api-key for public tracking endpoints.
 *
 * Preferred source is ApiKey (hashed key). IntegrationSettings public keys are
 * still accepted temporarily for backward compatibility.
 */
export async function validateTrackingApiKey(
  request: NextRequest,
  options: { requireWriteScope?: boolean } = {}
): Promise<TrackingApiKeyValidation> {
  const rawKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key');

  if (!rawKey) {
    return { valid: false, source: 'none' };
  }

  // Preferred flow: hashed lookup via api_keys
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } }).catch(() => null);

  if (apiKey && apiKey.isActive && (!apiKey.expiresAt || apiKey.expiresAt > new Date())) {
    if (options.requireWriteScope) {
      const scopes = Array.isArray(apiKey.scopes) ? apiKey.scopes : [];
      const canWrite = scopes.includes('write') || scopes.includes('admin');
      if (!canWrite) {
        return { valid: false, source: 'none' };
      }
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => null);

    return { valid: true, source: 'api_keys', apiKeyId: apiKey.id, userId: apiKey.userId };
  }

  // Legacy flow: integration settings public key
  const integration = await prisma.integrationSettings.findFirst({
    where: {
      publicKey: rawKey,
      isActive: true,
    },
    select: { id: true },
  }).catch(() => null);

  if (integration) {
    return { valid: true, source: 'integration_settings' };
  }

  return { valid: false, source: 'none' };
}
