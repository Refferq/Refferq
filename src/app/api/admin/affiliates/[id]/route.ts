import { withSystemLocale } from '@/i18n/runtime.server';

import { label as __label } from "@/i18n";
import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';


// Update affiliate status
 async function PATCHHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: __tr("Status is required") },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: __tr("Invalid status. Must be one of: {0}", [validStatuses.join(', ')]) },
        { status: 400 }
      );
    }

    // Get affiliate to find userId
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: __tr("Affiliate not found") },
        { status: 404 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: affiliate.userId },
      data: {
        status: status as UserStatus
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'UPDATE_AFFILIATE_STATUS',
        objectType: 'AFFILIATE',
        objectId: params.id,
        payload: {
          oldStatus: affiliate.user.status,
          newStatus: status,
          notes: notes || null,
          affiliateEmail: affiliate.user.email
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: __tr("Affiliate status updated to {0}", [__label(status)]),
      affiliate: {
        id: affiliate.id,
        userId: updatedUser.id,
        status: updatedUser.status
      }
    });

  } catch (error) {
    console.error('Update affiliate status error:', error);
    return NextResponse.json(
      { error: __tr("Failed to update affiliate status") },
      { status: 500 }
    );
  }
}

// Delete affiliate
 async function DELETEHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Get affiliate to find userId
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: __tr("Affiliate not found") },
        { status: 404 }
      );
    }

    // Delete user (will cascade delete affiliate due to Prisma schema)
    await prisma.user.delete({
      where: { id: affiliate.userId }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'DELETE_AFFILIATE',
        objectType: 'AFFILIATE',
        objectId: params.id,
        payload: {
          affiliateName: affiliate.user.name,
          affiliateEmail: affiliate.user.email,
          referralCode: affiliate.referralCode
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: __tr("Affiliate deleted successfully")
    });

  } catch (error) {
    console.error('Delete affiliate error:', error);
    return NextResponse.json(
      { error: __tr("Failed to delete affiliate") },
      { status: 500 }
    );
  }
}

export const PATCH = withSystemLocale(PATCHHandler);
export const DELETE = withSystemLocale(DELETEHandler);
