import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

async function verifyAdmin(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN' || user.status !== 'ACTIVE') return null;
    return user;
  } catch (_e) {
    return null;
  }
}

function generateApiKey(): { key: string; prefix: string; keyHash: string } {
  const key = `rfq_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = key.slice(0, 12);
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  return { key, prefix, keyHash };
}

// GET - List API keys (masked)
export async function GET(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        _count: {
          select: { usageLogs: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys.map((k) => ({
        ...k,
        maskedKey: `${k.prefix}...`,
        totalRequests: k._count.usageLogs,
      })),
    });
  } catch (error) {
    console.error('API keys GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, scopes, rateLimit, expiresAt } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { key, prefix, keyHash } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: null, // Never store the raw key in the database
        keyHash,   // Store only the SHA-256 hash for verification
        prefix,
        userId: user.id,
        scopes: scopes || ['read'],
        rateLimit: rateLimit || 100,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Return the full key ONLY on creation - it won't be shown again
    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key, // Full key only shown once (not stored in DB)
        prefix: apiKey.prefix,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    console.error('API keys POST error:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

// PUT - Update an API key (toggle active, change rate limit, etc.)
export async function PUT(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });

    // Only allow updating certain fields
    const allowedUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.isActive !== undefined) allowedUpdates.isActive = updates.isActive;
    if (updates.rateLimit !== undefined) allowedUpdates.rateLimit = updates.rateLimit;
    if (updates.scopes !== undefined) allowedUpdates.scopes = updates.scopes;

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: allowedUpdates,
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        scopes: apiKey.scopes,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
      },
    });
  } catch (error) {
    console.error('API keys PUT error:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}

// DELETE - Revoke an API key
export async function DELETE(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });

    await prisma.apiKey.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    console.error('API keys DELETE error:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
