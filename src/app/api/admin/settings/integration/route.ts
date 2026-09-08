import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// Verify admin auth with DB check
async function verifyAdmin(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN' || user.status !== 'ACTIVE') return null;
    return user;
  } catch (_e) { return null; }
}

// GET /api/admin/settings/integration - Get integration settings
 async function GETHandler(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const integration = await prisma.integrationSettings.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      integration,
    });
  } catch (error) {
    console.error('GET /api/admin/settings/integration error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to fetch integration settings") },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/integration - Create or update integration settings
 async function POSTHandler(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { provider, apiKey, publicKey, webhookUrl, trackingScript, isActive, config } = body;

    // Validate provider
    if (!provider) {
      return NextResponse.json(
        { success: false, error: __tr("Provider is required") },
        { status: 400 }
      );
    }

    // Check if integration settings already exist
    const existingIntegration = await prisma.integrationSettings.findUnique({
      where: { userId: user.id },
    });

    let integration;

    if (existingIntegration) {
      // Update existing integration
      integration = await prisma.integrationSettings.update({
        where: { userId: user.id },
        data: {
          provider,
          apiKey: apiKey || null,
          publicKey: publicKey || null,
          webhookUrl: webhookUrl || null,
          trackingScript: trackingScript || null,
          isActive: isActive ?? true,
          config: config || {},
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new integration
      integration = await prisma.integrationSettings.create({
        data: {
          userId: user.id,
          provider,
          apiKey: apiKey || null,
          publicKey: publicKey || null,
          webhookUrl: webhookUrl || null,
          trackingScript: trackingScript || null,
          isActive: isActive ?? true,
          config: config || {},
        },
      });
    }

    return NextResponse.json({
      success: true,
      integration,
      message: __tr("Integration settings saved successfully"),
    });
  } catch (error) {
    console.error('POST /api/admin/settings/integration error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to save integration settings") },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/settings/integration - Delete integration settings
 async function DELETEHandler(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const integration = await prisma.integrationSettings.findUnique({
      where: { userId: user.id },
    });

    if (!integration) {
      return NextResponse.json(
        { success: false, error: __tr("Integration settings not found") },
        { status: 404 }
      );
    }

    await prisma.integrationSettings.delete({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: __tr("Integration settings deleted successfully"),
    });
  } catch (error) {
    console.error('DELETE /api/admin/settings/integration error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to delete integration settings") },
      { status: 500 }
    );
  }
}

export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
export const DELETE = withSystemLocale(DELETEHandler);
