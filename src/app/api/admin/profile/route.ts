import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/profile - Get admin profile
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

    // Return user profile (without password)
    const { password, ...userProfile } = user;

    return NextResponse.json({
      success: true,
      user: userProfile,
    });

  } catch (error) {
    console.error('GET /api/admin/profile error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to fetch profile") },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/profile - Update admin profile
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

    // Get update data from request
    const body = await request.json();
    const { name, profilePicture } = body;

    // Validate input
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: __tr("Name is required") },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        ...(profilePicture && { profilePicture }),
      }
    });

    // Return updated profile (without password)
    const { password, ...userProfile } = updatedUser;

    return NextResponse.json({
      success: true,
      message: __tr("Profile updated successfully"),
      user: userProfile,
    });

  } catch (error) {
    console.error('PUT /api/admin/profile error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to update profile") },
      { status: 500 }
    );
  }
}

export const GET = withSystemLocale(GETHandler);
export const PUT = withSystemLocale(PUTHandler);
