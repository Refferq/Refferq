import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

/**
 * POST /api/admin/integration/generate-key - Generate API keys for tracking
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string }
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

    // Generate secure API keys
    const publicKey = 'pk_' + crypto.randomBytes(32).toString('hex');
    const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex');

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
          apiKey,
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
          apiKey,
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
        apiKey: integration.apiKey,
      },
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
