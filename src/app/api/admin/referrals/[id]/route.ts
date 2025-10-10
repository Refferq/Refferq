import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key'
);

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
    const { action, reviewNotes } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const referral = await prisma.referral.findUnique({
      where: { id: params.id },
      include: {
        affiliate: true
      }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    const updatedReferral = await prisma.referral.update({
      where: { id: params.id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewNotes: reviewNotes || null,
        reviewedBy: user.id,
        reviewedAt: new Date()
      }
    });

    // If approved, create conversion and commission
    if (action === 'approve') {
      const conversion = await prisma.conversion.create({
        data: {
          affiliateId: referral.affiliateId,
          referralId: referral.id,
          eventType: 'PURCHASE',
          amountCents: 10000, // Default $100 conversion value
          status: 'PENDING'
        }
      });

      // Create commission (10% of conversion value)
      const commissionRate = 0.1;
      const commissionAmount = Math.round(10000 * commissionRate);
      
      await prisma.commission.create({
        data: {
          affiliateId: referral.affiliateId,
          conversionId: conversion.id,
          userId: referral.affiliate.userId,
          rate: commissionRate,
          amountCents: commissionAmount,
          status: 'PENDING'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Referral ${action}d successfully`,
      referral: updatedReferral
    });

  } catch (error) {
    console.error('Referral approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}

// Add PATCH method for updating referral/customer details
export async function PATCH(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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
    const { action, leadName, leadEmail, status, reviewNotes } = body;

    // Check if referral exists
    const referral = await prisma.referral.findUnique({
      where: { id: params.id },
      include: { affiliate: true }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    // If action is provided, handle approve/reject (legacy behavior)
    if (action && ['approve', 'reject'].includes(action)) {
      const updatedReferral = await prisma.referral.update({
        where: { id: params.id },
        data: {
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          reviewNotes: reviewNotes || null,
          reviewedBy: user.id,
          reviewedAt: new Date()
        }
      });

      // If approved, create conversion and commission
      if (action === 'approve') {
        const conversion = await prisma.conversion.create({
          data: {
            affiliateId: referral.affiliateId,
            referralId: referral.id,
            eventType: 'PURCHASE',
            amountCents: 10000,
            status: 'PENDING'
          }
        });

        const commissionRate = 0.1;
        const commissionAmount = Math.round(10000 * commissionRate);
        
        await prisma.commission.create({
          data: {
            affiliateId: referral.affiliateId,
            conversionId: conversion.id,
            userId: referral.affiliate.userId,
            rate: commissionRate,
            amountCents: commissionAmount,
            status: 'PENDING'
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Referral ${action}d successfully`,
        referral: updatedReferral
      });
    }

    // Otherwise, handle customer detail updates
    const updateData: any = {};
    
    if (leadName !== undefined) updateData.leadName = leadName;
    if (leadEmail !== undefined) updateData.leadEmail = leadEmail;
    if (status !== undefined) {
      // Map status values
      updateData.status = status;
      updateData.reviewedBy = user.id;
      updateData.reviewedAt = new Date();
    }

    const updatedReferral = await prisma.referral.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      referral: updatedReferral
    });

  } catch (error) {
    console.error('Update referral error:', error);
    return NextResponse.json(
      { error: 'Failed to update referral' },
      { status: 500 }
    );
  }
}

// Add DELETE method to allow admins to delete referrals
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    // Check if referral exists
    const referral = await prisma.referral.findUnique({
      where: { id: params.id }
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    // Delete the referral (will cascade delete related commissions due to Prisma schema)
    await prisma.referral.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Referral deleted successfully'
    });

  } catch (error) {
    console.error('Delete referral error:', error);
    return NextResponse.json(
      { error: 'Failed to delete referral' },
      { status: 500 }
    );
  }
}