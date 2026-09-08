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

// GET /api/admin/settings/profile - Get current user profile
 async function GETHandler(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, error: __tr("User not found") },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: userData,
    });
  } catch (error) {
    console.error('GET /api/admin/settings/profile error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to fetch profile") },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/profile - Update user profile
 async function PUTHandler(req: NextRequest) {
  try {
    const user = await verifyAdmin(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, email, profilePicture } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: __tr("Name and email are required") },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: __tr("Email is already in use") },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        profilePicture: profilePicture || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedUser,
      message: __tr("Profile updated successfully"),
    });
  } catch (error) {
    console.error('PUT /api/admin/settings/profile error:', error);
    return NextResponse.json(
      { success: false, error: __tr("Failed to update profile") },
      { status: 500 }
    );
  }
}

export const GET = withSystemLocale(GETHandler);
export const PUT = withSystemLocale(PUTHandler);
