// API service for the affiliate platform
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types based on the specification
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'affiliate';
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
}

export interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  balance_cents: number;
  payout_details?: object;
  created_at: string;
}

export interface Referral {
  id: string;
  affiliate_id: string;
  lead_name: string;
  lead_email: string;
  metadata?: object;
  status: 'submitted' | 'approved' | 'rejected' | 'converted';
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface Commission {
  id: string;
  affiliate_id: string;
  amount_cents: number;
  rate: number;
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
  created_at: string;
  processed_at?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const result = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.token = result.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', result.token);
    }
    
    return result;
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const result = await this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    this.token = result.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', result.token);
    }
    
    return result;
  }

  logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Affiliate methods
  async getAffiliateProfile(): Promise<Affiliate> {
    return this.request<Affiliate>('/api/affiliate/me');
  }

  async submitManualReferral(leadName: string, leadEmail: string, metadata?: object): Promise<Referral> {
    return this.request<Referral>('/api/affiliate/referrals/manual', {
      method: 'POST',
      body: JSON.stringify({
        lead_name: leadName,
        lead_email: leadEmail,
        metadata,
      }),
    });
  }

  async getAffiliateReferrals(): Promise<Referral[]> {
    return this.request<Referral[]>('/api/affiliate/referrals');
  }

  async getAffiliateCommissions(): Promise<Commission[]> {
    return this.request<Commission[]>('/api/affiliate/commissions');
  }

  // Admin methods
  async getAdminReferrals(): Promise<Referral[]> {
    return this.request<Referral[]>('/api/admin/referrals');
  }

  async approveReferral(referralId: string, notes?: string): Promise<Referral> {
    return this.request<Referral>(`/api/admin/referrals/${referralId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectReferral(referralId: string, notes?: string): Promise<Referral> {
    return this.request<Referral>(`/api/admin/referrals/${referralId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async getAdminCommissions(): Promise<Commission[]> {
    return this.request<Commission[]>('/api/admin/commissions');
  }

  async approveCommission(commissionId: string): Promise<Commission> {
    return this.request<Commission>(`/api/admin/commissions/${commissionId}/approve`, {
      method: 'POST',
    });
  }

  async generatePayoutCsv(): Promise<{ csv_url: string; total_amount: number }> {
    return this.request<{ csv_url: string; total_amount: number }>('/api/admin/payouts/run', {
      method: 'POST',
    });
  }

  async getPayouts(): Promise<Payout[]> {
    return this.request<Payout[]>('/api/admin/payouts');
  }

  // Analytics methods
  async getAffiliateStats(): Promise<{
    total_earnings: number;
    total_referrals: number;
    pending_referrals: number;
    conversion_rate: number;
  }> {
    return this.request('/api/affiliate/stats');
  }

  async getAdminStats(): Promise<{
    total_affiliates: number;
    pending_referrals: number;
    total_commissions: number;
    conversion_rate: number;
  }> {
    return this.request('/api/admin/stats');
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;