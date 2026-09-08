import { withSystemLocale } from '@/i18n/runtime.server';

import { label as __label } from "@/i18n";
import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


 async function PUTHandler(
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
    const { action, reviewNotes } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: __tr("Invalid action") },
        { status: 400 }
      );
    }

    const referral = await prisma.referral.findUnique({
      where: { id: params.id },
      include: {
        affiliate: {
          include: { partnerGroup: true }
        }
      }
    });

    if (!referral) {
      return NextResponse.json(
        { error: __tr("Referral not found") },
        { status: 404 }
      );
    }

    // Get estimated value from referral metadata
    const metadata = referral.metadata as Record<string, any> || {};
    const estimatedValueCents = Number(metadata?.estimated_value) * 100 || 10000;

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
      // Get commission rate from partner group or use default 10%
      const commissionRate = referral.affiliate.partnerGroup?.commissionRate
        ? referral.affiliate.partnerGroup.commissionRate / 100
        : 0.1;

      const conversion = await prisma.conversion.create({
        data: {
          affiliateId: referral.affiliateId,
          referralId: referral.id,
          eventType: 'PURCHASE',
          amountCents: estimatedValueCents,
          status: 'PENDING'
        }
      });

      const commissionAmount = Math.round(estimatedValueCents * commissionRate);

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
      message: __tr(action === "approve" ? "Referral approved successfully" : "Referral rejected successfully"),
      referral: updatedReferral
    });

  } catch (error) {
    console.error('Referral approval error:', error);
    return NextResponse.json(
      { error: __tr("Failed to process referral") },
      { status: 500 }
    );
  }
}

// Add PATCH method for updating referral/customer details
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
    const { action, leadName, leadEmail, status, reviewNotes } = body;

    // Check if referral exists
    const referral = await prisma.referral.findUnique({
      where: { id: params.id },
      include: { affiliate: { include: { partnerGroup: true } } }
    });

    if (!referral) {
      return NextResponse.json(
        { error: __tr("Referral not found") },
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
        const refMetadata = referral.metadata as Record<string, any> || {};
        const estValueCents = Number(refMetadata?.estimated_value) * 100 || 10000;
        const commissionRate = referral.affiliate.partnerGroup?.commissionRate
          ? referral.affiliate.partnerGroup.commissionRate / 100
          : 0.1;

        const conversion = await prisma.conversion.create({
          data: {
            affiliateId: referral.affiliateId,
            referralId: referral.id,
            eventType: 'PURCHASE',
            amountCents: estValueCents,
            status: 'PENDING'
          }
        });

        const commissionAmount = Math.round(estValueCents * commissionRate);
        
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
        message: __tr(action === "approve" ? "Referral approved successfully" : "Referral rejected successfully"),
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
      message: __tr("Customer updated successfully"),
      referral: updatedReferral
    });

  } catch (error) {
    console.error('Update referral error:', error);
    return NextResponse.json(
      { error: __tr("Failed to update referral") },
      { status: 500 }
    );
  }
}

// Add DELETE method to allow admins to delete referrals
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

    // Check if referral exists
    const referral = await prisma.referral.findUnique({
      where: { id: params.id }
    });

    if (!referral) {
      return NextResponse.json(
        { error: __tr("Referral not found") },
        { status: 404 }
      );
    }

    // Delete the referral (will cascade delete related commissions due to Prisma schema)
    await prisma.referral.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: __tr("Referral deleted successfully")
    });

  } catch (error) {
    console.error('Delete referral error:', error);
    return NextResponse.json(
      { error: __tr("Failed to delete referral") },
      { status: 500 }
    );
  }
}
export const PUT = withSystemLocale(PUTHandler);
export const PATCH = withSystemLocale(PATCHHandler);
export const DELETE = withSystemLocale(DELETEHandler);
