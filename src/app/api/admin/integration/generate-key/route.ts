import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as crypto from 'crypto';

/**
 * POST /api/admin/integration/generate-key - Generate API keys for tracking
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Generate legacy public key (for compatibility) + modern hashed tracking key.
    const publicKey = 'pk_' + crypto.randomBytes(32).toString('hex');
    const rawTrackingKey = `rfq_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawTrackingKey).digest('hex');
    const prefix = rawTrackingKey.slice(0, 12);

    await prisma.apiKey.create({
      data: {
        name: `Integration key (${new Date().toISOString().slice(0, 10)})`,
        key: null,
        keyHash,
        prefix,
        userId: user.id,
        scopes: ['write'],
        rateLimit: 300,
      },
    });

    // Check if integration settings exist
    const existing = await prisma.integrationSettings.findUnique({
      where: { userId: user.id }
    });

    let integration;

    if (existing) {
      // Update existing
      integration = await prisma.integrationSettings.update({
        where: { userId: user.id },
        data: {
          publicKey,
          apiKey: null,
          provider: 'refferq',
          isActive: true,
        }
      });
    } else {
      // Create new
      integration = await prisma.integrationSettings.create({
        data: {
          userId: user.id,
          publicKey,
          apiKey: null,
          provider: 'refferq',
          isActive: true,
          config: {},
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'API keys generated successfully',
      keys: {
        publicKey: integration.publicKey,
        apiKey: rawTrackingKey,
      },
      note: 'Use apiKey (rfq_...) in x-api-key header. publicKey is legacy and will be removed.',
      integration,
    });

  } catch (error) {
    console.error('Generate API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate API keys' },
      { status: 500 }
    );
  }
}
