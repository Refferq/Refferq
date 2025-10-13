import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
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
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all partner groups with member count
    const partnerGroups = await prisma.partnerGroup.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Get affiliate counts for each partner group
    const affiliateCounts = await Promise.all(
      partnerGroups.map(async (pg) => {
        const count = await prisma.affiliate.count({
          where: { partnerGroupId: pg.id } as any
        });
        return { id: pg.id, count };
      })
    );
    
    const countMap = new Map(affiliateCounts.map(ac => [ac.id, ac.count]));

    return NextResponse.json({
      success: true,
      partnerGroups: partnerGroups.map(pg => ({
        id: pg.id,
        name: pg.name,
        description: pg.description,
        commissionRate: pg.commissionRate,
        signupUrl: pg.signupUrl,
        isDefault: pg.isDefault,
        memberCount: countMap.get(pg.id) || 0,
        createdAt: pg.createdAt,
        updatedAt: pg.updatedAt
      }))
    });

  } catch (error) {
    console.error('Partner groups API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
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
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, commissionRate, signupUrl, isDefault } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Partner group name is required' },
        { status: 400 }
      );
    }

    if (!commissionRate || typeof commissionRate !== 'number' || commissionRate <= 0 || commissionRate > 1) {
      return NextResponse.json(
        { error: 'Commission rate must be a number between 0 and 1 (e.g., 0.20 for 20%)' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.partnerGroup.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create partner group
    const partnerGroup = await prisma.partnerGroup.create({
      data: {
        name,
        description: description || null,
        commissionRate,
        signupUrl: signupUrl || null,
        isDefault: isDefault || false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Partner group created successfully',
      partnerGroup
    });

  } catch (error) {
    console.error('Create partner group error:', error);
    return NextResponse.json(
      { error: 'Failed to create partner group' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
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
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, description, commissionRate, signupUrl, isDefault } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Partner group ID is required' },
        { status: 400 }
      );
    }

    // Validation
    if (commissionRate && (typeof commissionRate !== 'number' || commissionRate <= 0 || commissionRate > 1)) {
      return NextResponse.json(
        { error: 'Commission rate must be a number between 0 and 1' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.partnerGroup.updateMany({
        where: { 
          isDefault: true,
          NOT: { id }
        },
        data: { isDefault: false }
      });
    }

    // Update partner group
    const partnerGroup = await prisma.partnerGroup.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(commissionRate && { commissionRate }),
        ...(signupUrl !== undefined && { signupUrl }),
        ...(isDefault !== undefined && { isDefault })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Partner group updated successfully',
      partnerGroup
    });

  } catch (error) {
    console.error('Update partner group error:', error);
    return NextResponse.json(
      { error: 'Failed to update partner group' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
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
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Partner group ID is required' },
        { status: 400 }
      );
    }

    // Check if group has members
    const group = await prisma.partnerGroup.findUnique({
      where: { id }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Partner group not found' },
        { status: 404 }
      );
    }
    
    // Count affiliates in this group
    const memberCount = await prisma.affiliate.count({
      where: { partnerGroupId: id } as any
    });

    if (memberCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete partner group with ${memberCount} active member(s)` },
        { status: 400 }
      );
    }

    // Delete partner group
    await prisma.partnerGroup.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Partner group deleted successfully'
    });

  } catch (error) {
    console.error('Delete partner group error:', error);
    return NextResponse.json(
      { error: 'Failed to delete partner group' },
      { status: 500 }
    );
  }
}
