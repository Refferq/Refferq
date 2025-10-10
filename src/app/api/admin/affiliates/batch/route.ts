import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

// Batch update affiliates
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { affiliateIds, action, status, group } = body;

    if (!affiliateIds || !Array.isArray(affiliateIds) || affiliateIds.length === 0) {
      return NextResponse.json(
        { error: 'affiliateIds array is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'action is required (changeStatus, changeGroup, delete)' },
        { status: 400 }
      );
    }

    let updatedCount = 0;

    switch (action) {
      case 'changeStatus':
        if (!status) {
          return NextResponse.json(
            { error: 'status is required for changeStatus action' },
            { status: 400 }
          );
        }

        // Validate status
        const validStatuses = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
            { status: 400 }
          );
        }

        // Get all affiliates to find their userIds
        const affiliates = await prisma.affiliate.findMany({
          where: { id: { in: affiliateIds } }
        });

        const userIds = affiliates.map(aff => aff.userId);

        // Update user statuses
        const result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: status as UserStatus }
        });

        updatedCount = result.count;

        // Create audit log
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'BATCH_UPDATE_AFFILIATE_STATUS',
            objectType: 'AFFILIATE',
            objectId: 'BATCH',
            payload: {
              affiliateIds,
              newStatus: status,
              count: updatedCount
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: `Updated ${updatedCount} affiliate(s) status to ${status}`,
          count: updatedCount
        });

      case 'changeGroup':
        if (!group) {
          return NextResponse.json(
            { error: 'group is required for changeGroup action' },
            { status: 400 }
          );
        }

        // Update affiliate metadata with group
        for (const affiliateId of affiliateIds) {
          await prisma.affiliate.update({
            where: { id: affiliateId },
            data: {
              payoutDetails: {
                // Preserve existing data and add/update group
                ...(await prisma.affiliate.findUnique({
                  where: { id: affiliateId },
                  select: { payoutDetails: true }
                }).then(a => a?.payoutDetails as any) || {}),
                group
              }
            }
          });
          updatedCount++;
        }

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'BATCH_UPDATE_AFFILIATE_GROUP',
            objectType: 'AFFILIATE',
            objectId: 'BATCH',
            payload: {
              affiliateIds,
              newGroup: group,
              count: updatedCount
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: `Updated ${updatedCount} affiliate(s) group to ${group}`,
          count: updatedCount
        });

      case 'delete':
        // Get all affiliates to find their userIds
        const affiliatesToDelete = await prisma.affiliate.findMany({
          where: { id: { in: affiliateIds } },
          include: { user: true }
        });

        const userIdsToDelete = affiliatesToDelete.map(aff => aff.userId);

        // Delete users (will cascade delete affiliates)
        const deleteResult = await prisma.user.deleteMany({
          where: { id: { in: userIdsToDelete } }
        });

        updatedCount = deleteResult.count;

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'BATCH_DELETE_AFFILIATES',
            objectType: 'AFFILIATE',
            objectId: 'BATCH',
            payload: {
              affiliateIds,
              count: updatedCount,
              deletedEmails: affiliatesToDelete.map(a => a.user.email)
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: `Deleted ${updatedCount} affiliate(s)`,
          count: updatedCount
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: changeStatus, changeGroup, or delete' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Batch update affiliates error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch update' },
      { status: 500 }
    );
  }
}
