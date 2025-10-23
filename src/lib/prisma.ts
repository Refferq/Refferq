import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database service class with Prisma methods
export class DatabaseService {
  // User operations
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: 'ADMIN' | 'AFFILIATE';
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        status: userData.role === 'ADMIN' ? 'ACTIVE' : 'INACTIVE',
      },
    });

    return user;
  }

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        affiliate: true,
      },
    });
  }

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        affiliate: true,
      },
    });
  }

  async updateUser(id: string, updates: any) {
    return await prisma.user.update({
      where: { id },
      data: updates,
    });
  }

  async verifyPassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Affiliate operations
  async createAffiliate(affiliateData: {
    userId: string;
    referralCode: string;
    payoutDetails?: any;
  }) {
    return await prisma.affiliate.create({
      data: {
        userId: affiliateData.userId,
        referralCode: affiliateData.referralCode,
        payoutDetails: affiliateData.payoutDetails || {},
      },
    });
  }

  async getAffiliateByUserId(userId: string) {
    return await prisma.affiliate.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  async getAffiliateByReferralCode(code: string) {
    return await prisma.affiliate.findUnique({
      where: { referralCode: code },
      include: {
        user: true,
      },
    });
  }

  async getAllAffiliates() {
    return await prisma.affiliate.findMany({
      include: {
        user: true,
      },
    });
  }

  async updateAffiliate(id: string, updates: any) {
    return await prisma.affiliate.update({
      where: { id },
      data: updates,
    });
  }

  // Referral operations
  async createReferral(referralData: {
    affiliateId: string;
    leadName: string;
    leadEmail: string;
    metadata?: any;
  }) {
    return await prisma.referral.create({
      data: {
        affiliateId: referralData.affiliateId,
        leadName: referralData.leadName,
        leadEmail: referralData.leadEmail,
        metadata: referralData.metadata || {},
        status: 'PENDING',
      },
    });
  }

  async getReferralById(id: string) {
    return await prisma.referral.findUnique({
      where: { id },
      include: {
        affiliate: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getReferralsByAffiliate(affiliateId: string) {
    return await prisma.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingReferrals() {
    return await prisma.referral.findMany({
      where: { status: 'PENDING' },
      include: {
        affiliate: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReferral(id: string, updates: any) {
    return await prisma.referral.update({
      where: { id },
      data: updates,
    });
  }

  // Conversion operations
  async createConversion(conversionData: {
    affiliateId: string;
    referralId?: string;
    eventType: 'SIGNUP' | 'PURCHASE' | 'TRIAL' | 'LEAD';
    amountCents: number;
    currency?: string;
    eventMetadata?: any;
  }) {
    return await prisma.conversion.create({
      data: {
        affiliateId: conversionData.affiliateId,
        referralId: conversionData.referralId,
        eventType: conversionData.eventType,
        amountCents: conversionData.amountCents,
        currency: conversionData.currency || 'USD',
        eventMetadata: conversionData.eventMetadata || {},
        status: 'PENDING',
      },
    });
  }

  async getConversionsByAffiliate(affiliateId: string) {
    return await prisma.conversion.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Commission operations
  async createCommission(commissionData: {
    conversionId: string;
    affiliateId: string;
    userId: string;
    amountCents: number;
    rate: number;
    approvedBy?: string;
  }) {
    return await prisma.commission.create({
      data: {
        conversionId: commissionData.conversionId,
        affiliateId: commissionData.affiliateId,
        userId: commissionData.userId,
        amountCents: commissionData.amountCents,
        rate: commissionData.rate,
        status: commissionData.approvedBy ? 'APPROVED' : 'PENDING',
        approvedBy: commissionData.approvedBy,
        approvedAt: commissionData.approvedBy ? new Date() : undefined,
      },
    });
  }

  async getCommissionsByAffiliate(affiliateId: string) {
    return await prisma.commission.findMany({
      where: { affiliateId },
      include: {
        conversion: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingCommissions() {
    return await prisma.commission.findMany({
      where: { status: 'PENDING' },
      include: {
        affiliate: {
          include: {
            user: true,
          },
        },
        conversion: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCommission(id: string, updates: any) {
    return await prisma.commission.update({
      where: { id },
      data: updates,
    });
  }

  // Commission Rules
  async createCommissionRule(ruleData: {
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    conditions?: any;
    isDefault?: boolean;
  }) {
    return await prisma.commissionRule.create({
      data: ruleData,
    });
  }

  async getCommissionRules() {
    return await prisma.commissionRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDefaultCommissionRule() {
    return await prisma.commissionRule.findFirst({
      where: { isDefault: true },
    });
  }

  // Payout operations
  async createPayout(payoutData: {
    userId: string;
    affiliateId: string;
    amountCents: number;
    commissionCount: number;
    method?: string;
    notes?: string;
    createdBy: string;
  }) {
    return await prisma.payout.create({
      data: {
        userId: payoutData.userId,
        affiliateId: payoutData.affiliateId,
        amountCents: payoutData.amountCents,
        commissionCount: payoutData.commissionCount,
        method: payoutData.method || 'Bank Transfer',
        notes: payoutData.notes,
        status: 'PENDING',
        createdBy: payoutData.createdBy,
      },
    });
  }

  async getPayoutsByUser(userId: string) {
    return await prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tracking operations
  async createReferralClick(clickData: {
    referralId: string;
    ipAddress: string;
    userAgent?: string;
    referer?: string;
    metadata?: any;
  }) {
    return await prisma.referralClick.create({
      data: {
        referralId: clickData.referralId,
        ipAddress: clickData.ipAddress,
        userAgent: clickData.userAgent,
        referer: clickData.referer,
        metadata: clickData.metadata || {},
      },
    });
  }

  async getClicksByReferralId(referralId: string) {
    return await prisma.referralClick.findMany({
      where: { referralId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Audit log operations
  async createAuditLog(logData: {
    actorId: string;
    action: string;
    objectType: string;
    objectId: string;
    payload?: any;
  }) {
    return await prisma.auditLog.create({
      data: {
        actorId: logData.actorId,
        action: logData.action,
        objectType: logData.objectType,
        objectId: logData.objectId,
        payload: logData.payload || {},
      },
    });
  }

  // Analytics and statistics
  async getAffiliateStats(affiliateId: string) {
    const affiliate = await this.getAffiliateByUserId(affiliateId);
    if (!affiliate) {
      return {
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalCommissions: 0,
        pendingCommissions: 0,
        approvedCommissions: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
      };
    }

    const [clicks, conversions, commissions] = await Promise.all([
      prisma.referralClick.count({
        where: { 
          referral: { 
            affiliateId: affiliate.id 
          } 
        },
      }),
      prisma.conversion.count({
        where: { affiliateId: affiliate.id },
      }),
      prisma.commission.findMany({
        where: { affiliateId: affiliate.id },
      }),
    ]);

    const pendingCommissions = commissions.filter((c: any) => c.status === 'PENDING');
    const approvedCommissions = commissions.filter((c: any) => c.status === 'APPROVED');

    return {
      totalClicks: clicks,
      totalConversions: conversions,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      totalCommissions: commissions.length,
      pendingCommissions: pendingCommissions.length,
      approvedCommissions: approvedCommissions.length,
      totalEarnings: commissions.reduce((sum: number, c: any) => sum + c.amountCents, 0),
      pendingEarnings: pendingCommissions.reduce((sum: number, c: any) => sum + c.amountCents, 0),
    };
  }

  async getPlatformStats() {
    const [
      totalAffiliates,
      activeAffiliates,
      pendingAffiliates,
      totalReferrals,
      pendingReferrals,
      approvedReferrals,
      totalConversions,
      totalCommissions,
      clicks,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'AFFILIATE' } }),
      prisma.user.count({ where: { role: 'AFFILIATE', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'AFFILIATE', status: 'INACTIVE' } }),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: 'PENDING' } }),
      prisma.referral.count({ where: { status: 'APPROVED' } }),
      prisma.conversion.count(),
      prisma.commission.count(),
      prisma.referralClick.count(),
    ]);

    const conversions = await prisma.conversion.findMany({
      select: { amountCents: true },
    });

    const totalRevenue = conversions.reduce((sum: number, c: any) => sum + c.amountCents, 0);

    return {
      totalAffiliates,
      activeAffiliates,
      pendingAffiliates,
      totalReferrals,
      pendingReferrals,
      approvedReferrals,
      totalConversions,
      totalCommissions,
      totalRevenue,
      conversionRate: clicks > 0 ? (totalConversions / clicks) * 100 : 0,
    };
  }

  // Seed data for development
  async seedDatabase() {
    try {
      // Check if data already exists
      const existingUsers = await prisma.user.count();
      if (existingUsers > 0) {
        console.log('Database already seeded');
        return;
      }

      // Create admin user
      const adminUser = await this.createUser({
        email: 'admin@example.com',
        password: 'password',
        name: 'Admin User',
        role: 'ADMIN',
      });

      // Create affiliate users
      const affiliate1User = await this.createUser({
        email: 'sarah.johnson@example.com',
        password: 'password',
        name: 'Sarah Johnson',
        role: 'AFFILIATE',
      });

      const affiliate2User = await this.createUser({
        email: 'david.lee@example.com',
        password: 'password',
        name: 'David Lee',
        role: 'AFFILIATE',
      });

      // Update affiliate users to active
      await this.updateUser(affiliate1User.id, { status: 'ACTIVE' });
      await this.updateUser(affiliate2User.id, { status: 'ACTIVE' });

      // Create affiliate profiles
      const affiliate1 = await this.createAffiliate({
        userId: affiliate1User.id,
        referralCode: 'SARAH-TECH',
        payoutDetails: {
          method: 'bank_transfer',
          bankAccount: '*****1234',
          routingNumber: '123456789',
        },
      });

      const affiliate2 = await this.createAffiliate({
        userId: affiliate2User.id,
        referralCode: 'DAVID-SALES',
        payoutDetails: {
          method: 'stripe_connect',
          stripeAccountId: 'acct_1234567890',
        },
      });

      // Create commission rules
      await this.createCommissionRule({
        name: 'Standard Rate',
        type: 'PERCENTAGE',
        value: 15,
        isDefault: true,
      });

      await this.createCommissionRule({
        name: 'Enterprise Tier',
        type: 'PERCENTAGE',
        value: 20,
        conditions: { minAmountCents: 500000 }, // $5000+
      });

      await this.createCommissionRule({
        name: 'Bonus Rate',
        type: 'PERCENTAGE',
        value: 25,
        conditions: {
          tierRequirements: {
            minMonthlyReferrals: 10,
          },
        },
      });

      // Create sample referrals
      const referral1 = await this.createReferral({
        affiliateId: affiliate1.id,
        leadName: 'John Smith',
        leadEmail: 'john@techcorp.com',
        metadata: {
          company: 'TechCorp',
          notes: 'Enterprise client, high value lead',
          estimatedValue: 150000,
        },
      });

      const referral2 = await this.createReferral({
        affiliateId: affiliate2.id,
        leadName: 'Maria Garcia',
        leadEmail: 'maria@startup.io',
        metadata: {
          company: 'StartupXYZ',
          notes: 'Interested in premium plan',
          estimatedValue: 80000,
        },
      });

      // Approve one referral and create conversion
      await this.updateReferral(referral2.id, {
        status: 'APPROVED',
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        reviewNotes: 'Approved - verified lead quality',
      });

      // Create conversion for approved referral
      const conversion = await this.createConversion({
        affiliateId: affiliate1.id,
        eventType: 'PURCHASE',
        amountCents: 225000, // $2250
        eventMetadata: {
          customerId: 'cust_abc123',
          productId: 'prod_enterprise',
          planType: 'enterprise_annual',
        },
      });

      // Create commission
      await this.createCommission({
        conversionId: conversion.id,
        affiliateId: affiliate1.id,
        userId: affiliate1User.id,
        amountCents: 33750, // 15% of $2250
        rate: 15,
        approvedBy: adminUser.id,
      });

      // Update affiliate balance
      await this.updateAffiliate(affiliate1.id, {
        balanceCents: 33750,
      });

      // Create sample clicks
      await this.createReferralClick({
        referralId: referral1.id, // Use referral ID instead of referral code
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: { attributionKey: `attr_${Date.now()}` },
      });

      console.log('Database seeded successfully with sample data');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
}

export const db = new DatabaseService();