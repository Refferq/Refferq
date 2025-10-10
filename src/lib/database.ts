// Database simulation layer using localStorage for the white-label affiliate platform
// This simulates the PostgreSQL database schema from the specification

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'affiliate';
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  payout_details: {
    method?: 'bank_transfer' | 'stripe_connect';
    bank_account?: string;
    routing_number?: string;
    stripe_account_id?: string;
  };
  balance_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  affiliate_id: string;
  lead_name: string;
  lead_email: string;
  metadata: {
    company?: string;
    notes?: string;
    source?: string;
    estimated_value?: number;
  };
  status: 'submitted' | 'approved' | 'rejected' | 'converted';
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface ReferralClick {
  id: string;
  referral_code: string;
  ip: string;
  user_agent: string;
  cookie_attribution_key: string;
  created_at: string;
}

export interface Conversion {
  id: string;
  affiliate_id: string;
  referral_id?: string;
  event_type: 'signup' | 'purchase' | 'trial' | 'demo';
  amount_cents: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  event_metadata: {
    customer_id?: string;
    product_id?: string;
    plan_type?: string;
    source?: string;
    attribution_method?: string;
  };
  created_at: string;
}

export interface Commission {
  id: string;
  conversion_id: string;
  affiliate_id: string;
  amount_cents: number;
  rate: number; // percentage
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface Payout {
  id: string;
  affiliate_id: string;
  amount_cents: number;
  currency: string;
  method: 'bank_csv' | 'stripe_connect';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  metadata: {
    csv_file?: string;
    csv_content?: string;
    stripe_transfer_id?: string;
    bank_details?: any;
    batch_id?: string;
    processed_by?: string;
  };
  created_at: string;
  processed_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  object_type: string;
  object_id: string;
  payload: any;
  created_at: string;
}

export interface CommissionRule {
  id: string;
  name: string;
  type: 'percentage' | 'flat';
  value: number; // percentage (15) or cents (1500)
  min_amount_cents?: number;
  max_amount_cents?: number;
  tier_requirements?: {
    min_monthly_referrals?: number;
    min_total_revenue?: number;
  };
  is_default: boolean;
  created_at: string;
}

class DatabaseService {
  private getStorageKey(table: string): string {
    return `affiliate_platform_${table}`;
  }

  private loadTable<T>(table: string): T[] {
    const data = localStorage.getItem(this.getStorageKey(table));
    return data ? JSON.parse(data) : [];
  }

  private saveTable<T>(table: string, data: T[]): void {
    localStorage.setItem(this.getStorageKey(table), JSON.stringify(data));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private now(): string {
    return new Date().toISOString();
  }

  // Users
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const users = this.loadTable<User>('users');
    const user: User = {
      ...userData,
      id: this.generateId(),
      created_at: this.now(),
      updated_at: this.now(),
    };
    users.push(user);
    this.saveTable('users', users);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = this.loadTable<User>('users');
    return users.find(u => u.email === email) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const users = this.loadTable<User>('users');
    return users.find(u => u.id === id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = this.loadTable<User>('users');
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates, updated_at: this.now() };
    this.saveTable('users', users);
    return users[index];
  }

  // Affiliates
  async createAffiliate(affiliateData: Omit<Affiliate, 'id' | 'created_at' | 'updated_at'>): Promise<Affiliate> {
    const affiliates = this.loadTable<Affiliate>('affiliates');
    const affiliate: Affiliate = {
      ...affiliateData,
      id: this.generateId(),
      created_at: this.now(),
      updated_at: this.now(),
    };
    affiliates.push(affiliate);
    this.saveTable('affiliates', affiliates);
    return affiliate;
  }

  async getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
    const affiliates = this.loadTable<Affiliate>('affiliates');
    return affiliates.find(a => a.user_id === userId) || null;
  }

  async getAffiliateByReferralCode(code: string): Promise<Affiliate | null> {
    const affiliates = this.loadTable<Affiliate>('affiliates');
    return affiliates.find(a => a.referral_code === code) || null;
  }

  async getAllAffiliates(): Promise<Affiliate[]> {
    return this.loadTable<Affiliate>('affiliates');
  }

  async updateAffiliate(id: string, updates: Partial<Affiliate>): Promise<Affiliate | null> {
    const affiliates = this.loadTable<Affiliate>('affiliates');
    const index = affiliates.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    affiliates[index] = { ...affiliates[index], ...updates, updated_at: this.now() };
    this.saveTable('affiliates', affiliates);
    return affiliates[index];
  }

  // Referrals
  async createReferral(referralData: Omit<Referral, 'id' | 'submitted_at'>): Promise<Referral> {
    const referrals = this.loadTable<Referral>('referrals');
    const referral: Referral = {
      ...referralData,
      id: this.generateId(),
      submitted_at: this.now(),
    };
    referrals.push(referral);
    this.saveTable('referrals', referrals);
    return referral;
  }

  async getReferralsByAffiliate(affiliateId: string): Promise<Referral[]> {
    const referrals = this.loadTable<Referral>('referrals');
    return referrals.filter(r => r.affiliate_id === affiliateId);
  }

  async getPendingReferrals(): Promise<Referral[]> {
    const referrals = this.loadTable<Referral>('referrals');
    return referrals.filter(r => r.status === 'submitted');
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | null> {
    const referrals = this.loadTable<Referral>('referrals');
    const index = referrals.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    referrals[index] = { ...referrals[index], ...updates };
    this.saveTable('referrals', referrals);
    return referrals[index];
  }

  // Conversions
  async createConversion(conversionData: Omit<Conversion, 'id' | 'created_at'>): Promise<Conversion> {
    const conversions = this.loadTable<Conversion>('conversions');
    const conversion: Conversion = {
      ...conversionData,
      id: this.generateId(),
      created_at: this.now(),
    };
    conversions.push(conversion);
    this.saveTable('conversions', conversions);
    return conversion;
  }

  async getConversionsByAffiliate(affiliateId: string): Promise<Conversion[]> {
    const conversions = this.loadTable<Conversion>('conversions');
    return conversions.filter(c => c.affiliate_id === affiliateId);
  }

  // Commissions
  async createCommission(commissionData: Omit<Commission, 'id' | 'created_at'>): Promise<Commission> {
    const commissions = this.loadTable<Commission>('commissions');
    const commission: Commission = {
      ...commissionData,
      id: this.generateId(),
      created_at: this.now(),
    };
    commissions.push(commission);
    this.saveTable('commissions', commissions);
    return commission;
  }

  async getCommissionsByAffiliate(affiliateId: string): Promise<Commission[]> {
    const commissions = this.loadTable<Commission>('commissions');
    return commissions.filter(c => c.affiliate_id === affiliateId);
  }

  async getPendingCommissions(): Promise<Commission[]> {
    const commissions = this.loadTable<Commission>('commissions');
    return commissions.filter(c => c.status === 'pending');
  }

  async updateCommission(id: string, updates: Partial<Commission>): Promise<Commission | null> {
    const commissions = this.loadTable<Commission>('commissions');
    const index = commissions.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    commissions[index] = { ...commissions[index], ...updates };
    this.saveTable('commissions', commissions);
    return commissions[index];
  }

  // Payouts
  async createPayout(payoutData: Omit<Payout, 'id' | 'created_at'>): Promise<Payout> {
    const payouts = this.loadTable<Payout>('payouts');
    const payout: Payout = {
      ...payoutData,
      id: this.generateId(),
      created_at: this.now(),
    };
    payouts.push(payout);
    this.saveTable('payouts', payouts);
    return payout;
  }

  async getPayoutsByAffiliate(affiliateId: string): Promise<Payout[]> {
    const payouts = this.loadTable<Payout>('payouts');
    return payouts.filter(p => p.affiliate_id === affiliateId);
  }

  // Commission Rules
  async createCommissionRule(ruleData: Omit<CommissionRule, 'id' | 'created_at'>): Promise<CommissionRule> {
    const rules = this.loadTable<CommissionRule>('commission_rules');
    const rule: CommissionRule = {
      ...ruleData,
      id: this.generateId(),
      created_at: this.now(),
    };
    rules.push(rule);
    this.saveTable('commission_rules', rules);
    return rule;
  }

  async getCommissionRules(): Promise<CommissionRule[]> {
    return this.loadTable<CommissionRule>('commission_rules');
  }

  async getDefaultCommissionRule(): Promise<CommissionRule | null> {
    const rules = this.loadTable<CommissionRule>('commission_rules');
    return rules.find(r => r.is_default) || null;
  }

  // Audit Logs
  async createAuditLog(logData: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const logs = this.loadTable<AuditLog>('audit_logs');
    const log: AuditLog = {
      ...logData,
      id: this.generateId(),
      created_at: this.now(),
    };
    logs.push(log);
    this.saveTable('audit_logs', logs);
    return log;
  }

  // Tracking
  async createReferralClick(clickData: Omit<ReferralClick, 'id' | 'created_at'>): Promise<ReferralClick> {
    const clicks = this.loadTable<ReferralClick>('referral_clicks');
    const click: ReferralClick = {
      ...clickData,
      id: this.generateId(),
      created_at: this.now(),
    };
    clicks.push(click);
    this.saveTable('referral_clicks', clicks);
    return click;
  }

  async getClicksByReferralCode(code: string): Promise<ReferralClick[]> {
    const clicks = this.loadTable<ReferralClick>('referral_clicks');
    return clicks.filter(c => c.referral_code === code);
  }

  // Analytics & Statistics
  async getAffiliateStats(affiliateId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    totalCommissions: number;
    pendingCommissions: number;
    approvedCommissions: number;
    totalEarnings: number;
    pendingEarnings: number;
  }> {
    const clicks = this.loadTable<ReferralClick>('referral_clicks');
    const conversions = this.loadTable<Conversion>('conversions');
    const commissions = this.loadTable<Commission>('commissions');
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

    const affiliateClicks = clicks.filter(c => c.referral_code === affiliate.referral_code);
    const affiliateConversions = conversions.filter(c => c.affiliate_id === affiliate.id);
    const affiliateCommissions = commissions.filter(c => c.affiliate_id === affiliate.id);

    const pendingCommissions = affiliateCommissions.filter(c => c.status === 'pending');
    const approvedCommissions = affiliateCommissions.filter(c => c.status === 'approved');

    return {
      totalClicks: affiliateClicks.length,
      totalConversions: affiliateConversions.length,
      conversionRate: affiliateClicks.length > 0 ? (affiliateConversions.length / affiliateClicks.length) * 100 : 0,
      totalCommissions: affiliateCommissions.length,
      pendingCommissions: pendingCommissions.length,
      approvedCommissions: approvedCommissions.length,
      totalEarnings: affiliateCommissions.reduce((sum, c) => sum + c.amount_cents, 0),
      pendingEarnings: pendingCommissions.reduce((sum, c) => sum + c.amount_cents, 0),
    };
  }

  async getPlatformStats(): Promise<{
    totalAffiliates: number;
    activeAffiliates: number;
    pendingAffiliates: number;
    totalReferrals: number;
    pendingReferrals: number;
    approvedReferrals: number;
    totalConversions: number;
    totalCommissions: number;
    totalRevenue: number;
    conversionRate: number;
  }> {
    const users = this.loadTable<User>('users');
    const referrals = this.loadTable<Referral>('referrals');
    const conversions = this.loadTable<Conversion>('conversions');
    const commissions = this.loadTable<Commission>('commissions');
    const clicks = this.loadTable<ReferralClick>('referral_clicks');

    const affiliateUsers = users.filter(u => u.role === 'affiliate');
    const activeAffiliates = affiliateUsers.filter(u => u.status === 'active');
    const pendingAffiliates = affiliateUsers.filter(u => u.status === 'pending');

    return {
      totalAffiliates: affiliateUsers.length,
      activeAffiliates: activeAffiliates.length,
      pendingAffiliates: pendingAffiliates.length,
      totalReferrals: referrals.length,
      pendingReferrals: referrals.filter(r => r.status === 'submitted').length,
      approvedReferrals: referrals.filter(r => r.status === 'approved').length,
      totalConversions: conversions.length,
      totalCommissions: commissions.length,
      totalRevenue: conversions.reduce((sum, c) => sum + c.amount_cents, 0),
      conversionRate: clicks.length > 0 ? (conversions.length / clicks.length) * 100 : 0,
    };
  }

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    // Check if data already exists
    const users = this.loadTable<User>('users');
    if (users.length > 0) return;

    // Create admin user
    const adminUser = await this.createUser({
      email: 'admin@example.com',
      password_hash: 'hashed_password_admin',
      name: 'Admin User',
      role: 'admin',
      status: 'active',
    });

    // Create sample affiliate users
    const affiliate1User = await this.createUser({
      email: 'sarah.johnson@example.com',
      password_hash: 'hashed_password_sarah',
      name: 'Sarah Johnson',
      role: 'affiliate',
      status: 'active',
    });

    const affiliate2User = await this.createUser({
      email: 'david.lee@example.com',
      password_hash: 'hashed_password_david',
      name: 'David Lee',
      role: 'affiliate',
      status: 'active',
    });

    // Create affiliates
    const affiliate1 = await this.createAffiliate({
      user_id: affiliate1User.id,
      referral_code: 'SARAH-TECH',
      payout_details: {
        method: 'bank_transfer',
        bank_account: '*****1234',
        routing_number: '123456789',
      },
      balance_cents: 23750,
    });

    const affiliate2 = await this.createAffiliate({
      user_id: affiliate2User.id,
      referral_code: 'DAVID-SALES',
      payout_details: {
        method: 'stripe_connect',
        stripe_account_id: 'acct_1234567890',
      },
      balance_cents: 15400,
    });

    // Create commission rules
    await this.createCommissionRule({
      name: 'Standard Rate',
      type: 'percentage',
      value: 15,
      is_default: true,
    });

    await this.createCommissionRule({
      name: 'Enterprise Tier',
      type: 'percentage',
      value: 20,
      min_amount_cents: 500000, // $5000+
      is_default: false,
    });

    await this.createCommissionRule({
      name: 'Bonus Rate',
      type: 'percentage',
      value: 25,
      tier_requirements: {
        min_monthly_referrals: 10,
      },
      is_default: false,
    });

    // Create sample referrals
    await this.createReferral({
      affiliate_id: affiliate1.id,
      lead_name: 'John Smith',
      lead_email: 'john@techcorp.com',
      metadata: {
        company: 'TechCorp',
        notes: 'Enterprise client, high value lead',
        estimated_value: 150000,
      },
      status: 'submitted',
    });

    await this.createReferral({
      affiliate_id: affiliate2.id,
      lead_name: 'Maria Garcia',
      lead_email: 'maria@startup.io',
      metadata: {
        company: 'StartupXYZ',
        notes: 'Interested in premium plan',
        estimated_value: 80000,
      },
      status: 'approved',
      reviewed_by: adminUser.id,
      reviewed_at: this.now(),
      review_notes: 'Approved - verified lead quality',
    });

    // Create sample conversions and commissions
    const conversion1 = await this.createConversion({
      affiliate_id: affiliate1.id,
      event_type: 'purchase',
      amount_cents: 225000, // $2250
      currency: 'USD',
      status: 'approved',
      event_metadata: {
        customer_id: 'cust_abc123',
        product_id: 'prod_enterprise',
        plan_type: 'enterprise_annual',
      },
    });

    await this.createCommission({
      conversion_id: conversion1.id,
      affiliate_id: affiliate1.id,
      amount_cents: 33750, // 15% of $2250
      rate: 15,
      status: 'approved',
      approved_by: adminUser.id,
      approved_at: this.now(),
    });

    // Create sample clicks
    await this.createReferralClick({
      referral_code: affiliate1.referral_code,
      ip: '192.168.1.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      cookie_attribution_key: 'attr_' + this.generateId(),
    });

    console.log('Sample data initialized successfully');
  }
}

export const db = new DatabaseService();