import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/integration - Get integration settings
 */
 async function GETHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: __tr("User not found") },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: __tr("Access denied. Admin role required.") },
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
        message: __tr("No integration configured. Generate API keys to get started."),
      });
    }

    return NextResponse.json({
      success: true,
      integration,
    });

  } catch (error) {
    console.error('GET integration settings error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to fetch integration settings") },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/integration - Update integration settings
 */
 async function PUTHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: __tr("User not found") },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: __tr("Access denied. Admin role required.") },
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
      message: __tr("Integration settings updated successfully"),
      integration,
    });

  } catch (error) {
    console.error('PUT integration settings error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to update integration settings") },
      { status: 500 }
    );
  }
}

export const GET = withSystemLocale(GETHandler);
export const PUT = withSystemLocale(PUTHandler);
