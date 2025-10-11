import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

/**
 * GET /api/admin/integration - Get integration settings
 */
export async function GET(request: NextRequest) {
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

    // Get integration settings
    const integration = await prisma.integrationSettings.findUnique({
      where: { userId: user.id }
    });

    if (!integration) {
      return NextResponse.json({
        success: true,
        integration: null,
        message: 'No integration configured. Generate API keys to get started.',
      });
    }

    return NextResponse.json({
      success: true,
      integration,
    });

  } catch (error) {
    console.error('GET integration settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integration settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/integration - Update integration settings
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { webhookUrl, trackingScript, isActive, config } = body;

    // Update integration settings
    const integration = await prisma.integrationSettings.update({
      where: { userId: user.id },
      data: {
        ...(webhookUrl !== undefined && { webhookUrl }),
        ...(trackingScript !== undefined && { trackingScript }),
        ...(isActive !== undefined && { isActive }),
        ...(config !== undefined && { config }),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Integration settings updated successfully',
      integration,
    });

  } catch (error) {
    console.error('PUT integration settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update integration settings' },
      { status: 500 }
    );
  }
}
