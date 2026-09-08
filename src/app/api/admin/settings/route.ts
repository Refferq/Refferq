import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';


 async function GETHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Admin access required") },
        { status: 403 }
      );
    }

    // Get program settings
    let programSettings = await prisma.programSettings.findFirst();

    // If no settings exist, create default settings
    if (!programSettings) {
      programSettings = await prisma.programSettings.create({
        data: {
          programId: `prg_${Date.now()}`,
          productName: 'BsBot',
          programName: __tr("BsBot's Affiliate Program"),
          websiteUrl: 'https://kyns.com',
          currency: 'INR',
          portalSubdomain: 'bsbot.tolt.io',
          minimumPayoutThreshold: 0,
          payoutTerm: __tr("NET-15"),
          commissionHoldDays: 30
        }
      });
    }

    // Get all commission rules
    const commissionRules = await prisma.commissionRule.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      settings: {
        ...programSettings,
        commissionRules: commissionRules.map(rule => ({
          id: rule.id,
          name: rule.name,
          type: rule.type,
          value: rule.value,
          conditions: rule.conditions,
          isDefault: rule.isDefault,
          isActive: rule.isActive,
          createdAt: rule.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: __tr("Failed to fetch settings") },
      { status: 500 }
    );
  }
}

 async function PUTHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Admin access required") },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Get existing settings or create new one
    let programSettings = await prisma.programSettings.findFirst();

    if (!programSettings) {
      programSettings = await prisma.programSettings.create({
        data: {
          programId: `prg_${Date.now()}`,
          productName: 'BsBot',
          programName: __tr("BsBot's Affiliate Program"),
          websiteUrl: 'https://kyns.com',
          currency: 'INR',
          portalSubdomain: 'bsbot.tolt.io'
        }
      });
    }

    // Update program settings — only allow specific fields (prevent mass assignment)
    const allowedFields = [
      'programName', 'productName', 'websiteUrl', 'currency', 'portalSubdomain',
      'companyName', 'companyLogo', 'primaryColor', 'secondaryColor',
      'cookieDuration', 'minimumPayout', 'payoutFrequency', 'autoApprove',
      'commissionType', 'commissionValue', 'brandingEnabled', 'commissionHoldDays'
    ];
    const sanitizedData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body && body[key] !== undefined) {
        sanitizedData[key] = body[key];
      }
    }

    const updatedSettings = await prisma.programSettings.update({
      where: { id: programSettings.id },
      data: sanitizedData
    });

    // Log the action
    await logAuditAction({
      actorId: user.id,
      action: 'UPDATE_SETTINGS',
      objectType: 'PROGRAM_SETTINGS',
      objectId: updatedSettings.id,
      payload: sanitizedData
    });

    // Clear cache
    revalidateTag('platform-settings', 'default');
    revalidateTag('program-settings', 'default');

    return NextResponse.json({
      success: true,
      message: __tr("Settings updated successfully"),
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Settings update API error:', error);
    return NextResponse.json(
      { error: __tr("Failed to update settings") },
      { status: 500 }
    );
  }
}

 async function POSTHandler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Admin access required") },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ruleData } = body;

    if (action === 'create') {
      // Create new commission rule
      const { name, type, value, conditions, isDefault } = ruleData;

      if (!name || !type || value === undefined) {
        return NextResponse.json(
          { error: __tr("Name, type, and value are required") },
          { status: 400 }
        );
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await prisma.commissionRule.updateMany({
          where: { isDefault: true },
          data: { isDefault: false }
        });
      }

      const newRule = await prisma.commissionRule.create({
        data: {
          name,
          type,
          value,
          conditions: conditions || {},
          isDefault: isDefault || false,
          isActive: true
        }
      });

      // Log the action
      await logAuditAction({
        actorId: user.id,
        action: 'CREATE_COMMISSION_RULE',
        objectType: 'COMMISSION_RULE',
        objectId: newRule.id,
        payload: ruleData
      });

      // Clear cache
      revalidateTag('program-settings', 'default');

      return NextResponse.json({
        success: true,
        message: __tr("Commission rule created successfully"),
        rule: newRule
      });
    }

    if (action === 'update') {
      // Update existing commission rule
      const { id, ...updates } = ruleData;

      if (!id) {
        return NextResponse.json(
          { error: __tr("Rule ID is required for update") },
          { status: 400 }
        );
      }

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        await prisma.commissionRule.updateMany({
          where: {
            id: { not: id },
            isDefault: true
          },
          data: { isDefault: false }
        });
      }

      const updatedRule = await prisma.commissionRule.update({
        where: { id },
        data: updates
      });

      // Clear cache
      revalidateTag('program-settings', 'default');

      return NextResponse.json({
        success: true,
        message: __tr("Commission rule updated successfully"),
        rule: updatedRule
      });
    }

    if (action === 'delete') {
      // Delete commission rule
      const { id } = ruleData;

      if (!id) {
        return NextResponse.json(
          { error: __tr("Rule ID is required for deletion") },
          { status: 400 }
        );
      }

      await prisma.commissionRule.delete({
        where: { id }
      });

      // Clear cache
      revalidateTag('program-settings', 'default');

      return NextResponse.json({
        success: true,
        message: __tr("Commission rule deleted successfully")
      });
    }

    return NextResponse.json(
      { error: __tr("Invalid action") },
      { status: 400 }
    );

  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: __tr("Failed to update settings") },
      { status: 500 }
    );
  }
}
export const GET = withSystemLocale(GETHandler);
export const PUT = withSystemLocale(PUTHandler);
export const POST = withSystemLocale(POSTHandler);
