// Service layer for API communication
class ApiService {
  private baseUrl = '/api';

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  // Authentication
  async login(email: string, password: string) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string, role: 'affiliate' | 'admin') {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  async logout() {
    return this.makeRequest('/auth/login', {
      method: 'DELETE',
    });
  }

  // Affiliate APIs
  async getAffiliateProfile() {
    return this.makeRequest('/affiliate/profile');
  }

  async updateAffiliateProfile(updates: any) {
    return this.makeRequest('/affiliate/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async submitReferral(referralData: any) {
    return this.makeRequest('/affiliate/referrals', {
      method: 'POST',
      body: JSON.stringify(referralData),
    });
  }

  async getAffiliateReferrals() {
    return this.makeRequest('/affiliate/referrals');
  }

  // Admin APIs
  async getPendingReferrals() {
    return this.makeRequest('/admin/referrals');
  }

  async processReferral(referralId: string, action: 'approve' | 'reject', notes?: string) {
    return this.makeRequest(`/admin/referrals/${referralId}`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    });
  }

  async getPendingCommissions() {
    return this.makeRequest('/admin/commissions');
  }

  async processCommissions(commissionIds: string[], action: 'approve' | 'reject') {
    return this.makeRequest('/admin/commissions', {
      method: 'POST',
      body: JSON.stringify({ commission_ids: commissionIds, action }),
    });
  }

  async getPlatformStats() {
    return this.makeRequest('/admin/dashboard');
  }

  async generatePayoutCSV() {
    return this.makeRequest('/admin/dashboard', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate_payout_csv' }),
    });
  }

  async initializeSampleData() {
    return this.makeRequest('/admin/dashboard', {
      method: 'POST',
      body: JSON.stringify({ action: 'initialize_sample_data' }),
    });
  }

  // Conversion tracking
  async trackConversion(conversionData: any) {
    return this.makeRequest('/webhook/conversion', {
      method: 'POST',
      body: JSON.stringify(conversionData),
    });
  }
}

export const api = new ApiService();