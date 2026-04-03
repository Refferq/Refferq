import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';
import {
  normalizeCommissionRuleType,
  normalizeProgramSettingsPatch,
} from '@/lib/program-settings-validation';


export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get program settings
    let programSettings = await prisma.programSettings.findFirst();

    // If no settings exist, create default settings
    if (!programSettings) {
      const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      programSettings = await prisma.programSettings.create({
        data: {
          programId: `prg_${Date.now()}`,
          productName: 'StudioSlow',
          programName: "StudioSlow's Affiliate Program",
          websiteUrl: appUrl,
          currency: 'RUB',
          portalSubdomain: 'affiliate',
          minimumPayoutThreshold: 0,
          payoutTerm: 'NET-30',
          commissionHoldDays: 30,
          minPayoutCents: 100000,
          payoutFrequency: 'MONTHLY',
          autoApprovePayouts: false,
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
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { data: sanitizedData, errors } = normalizeProgramSettingsPatch(body);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid settings payload', details: errors },
        { status: 400 }
      );
    }

    // Get existing settings or create new one
    let programSettings = await prisma.programSettings.findFirst();

    if (!programSettings) {
      const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      programSettings = await prisma.programSettings.create({
        data: {
          programId: `prg_${Date.now()}`,
          productName: 'StudioSlow',
          programName: "StudioSlow's Affiliate Program",
          websiteUrl: appUrl,
          currency: 'RUB',
          portalSubdomain: 'affiliate',
          payoutTerm: 'NET-30',
          minPayoutCents: 100000,
          payoutFrequency: 'MONTHLY',
          autoApprovePayouts: false,
        }
      });
    }

    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings fields provided' },
        { status: 400 }
      );
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
      message: 'Settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Settings update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ruleData } = body;

    if (action === 'create') {
      // Create new commission rule
      const { name, type, value, conditions, isDefault } = ruleData;
      const normalizedType = normalizeCommissionRuleType(type);

      if (!name || !normalizedType || value === undefined) {
        return NextResponse.json(
          { error: 'Name, valid type, and value are required' },
          { status: 400 }
        );
      }

      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        return NextResponse.json(
          { error: 'Value must be a non-negative number' },
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
          type: normalizedType,
          value: numericValue,
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
        message: 'Commission rule created successfully',
        rule: newRule
      });
    }

    if (action === 'update') {
      // Update existing commission rule
      const { id, ...updates } = ruleData;

      if (!id) {
        return NextResponse.json(
          { error: 'Rule ID is required for update' },
          { status: 400 }
        );
      }

      const normalizedUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) normalizedUpdates.name = updates.name;
      if (updates.value !== undefined) {
        const numericValue = Number(updates.value);
        if (!Number.isFinite(numericValue) || numericValue < 0) {
          return NextResponse.json(
            { error: 'Value must be a non-negative number' },
            { status: 400 }
          );
        }
        normalizedUpdates.value = numericValue;
      }
      if (updates.conditions !== undefined) normalizedUpdates.conditions = updates.conditions || {};
      if (updates.isDefault !== undefined) normalizedUpdates.isDefault = Boolean(updates.isDefault);
      if (updates.isActive !== undefined) normalizedUpdates.isActive = Boolean(updates.isActive);
      if (updates.type !== undefined) {
        const normalizedType = normalizeCommissionRuleType(updates.type);
        if (!normalizedType) {
          return NextResponse.json(
            { error: 'Invalid commission rule type' },
            { status: 400 }
          );
        }
        normalizedUpdates.type = normalizedType;
      }

      // If setting as default, unset other defaults
      if (normalizedUpdates.isDefault) {
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
        data: normalizedUpdates
      });

      await logAuditAction({
        actorId: user.id,
        action: 'UPDATE_COMMISSION_RULE',
        objectType: 'COMMISSION_RULE',
        objectId: updatedRule.id,
        payload: normalizedUpdates
      });

      // Clear cache
      revalidateTag('program-settings', 'default');

      return NextResponse.json({
        success: true,
        message: 'Commission rule updated successfully',
        rule: updatedRule
      });
    }

    if (action === 'delete') {
      // Delete commission rule
      const { id } = ruleData;

      if (!id) {
        return NextResponse.json(
          { error: 'Rule ID is required for deletion' },
          { status: 400 }
        );
      }

      await prisma.commissionRule.delete({
        where: { id }
      });

      await logAuditAction({
        actorId: user.id,
        action: 'DELETE_COMMISSION_RULE',
        objectType: 'COMMISSION_RULE',
        objectId: id,
        payload: {}
      });

      // Clear cache
      revalidateTag('program-settings', 'default');

      return NextResponse.json({
        success: true,
        message: 'Commission rule deleted successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
