'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalRevenue: number;
  totalClicks: number;
  totalLeads: number;
  totalReferredCustomers: number;
  totalAffiliates: number;
  pendingReferrals: number;
}

interface TopAffiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  totalRevenue: number;
  totalReferrals: number;
}

interface RecentCustomer {
  id: string;
  leadName: string;
  leadEmail: string;
  affiliateName: string;
  amountPaid: number;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  partnerId: string;
  partnerName: string;
  status: 'Active' | 'Trial' | 'Lead' | 'Canceled' | 'Suspended' | 'Refunded';
  subscriptionId?: string;
  totalPaid: number;
  totalCommission: number;
  createdAt: string;
}

interface ProgramSettings {
  id: string;
  programId: string;
  productName: string;
  programName: string;
  websiteUrl: string;
  currency: string;
  blockedCountries: string[];
  portalSubdomain: string;
  termsOfService: string;
  minimumPayoutThreshold: number;
  payoutTerm: string;
  payoutMethods: string[];
  brandBackgroundColor: string;
  brandButtonColor: string;
  brandTextColor: string;
  companyLogo: string;
  favicon: string;
  cookieDuration: number;
  urlParameters: string[];
  hideCustomerEmails: boolean;
  disablePersonalizedLinks: boolean;
  blockKeywords: string[];
  blockSocialMediaAds: string[];
  allowManualLeadSubmission: boolean;
  programWideCouponCode: string;
  hidePartnerLinks: boolean;
  requireBusinessEmail: boolean;
  enablePostbacks: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PartnerGroup {
  id: string;
  name: string;
  commissionRate: number;
  description: string;
  signupUrl: string;
  memberCount: number;
  createdAt: string;
}

interface Payout {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  method: string;
  commissionPeriodStart: string;
  commissionPeriodEnd: string;
  amountCents: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  processedAt?: string;
}

interface Partner {
  id: string;
  userId: string;
  name: string;
  email: string;
  referralCode: string;
  status: string;
  createdAt: string;
  clicks: number;
  leads: number;
  customers: number;
  revenue: number;
  earnings: number;
  groupName?: string;
}

interface PartnerProfileData {
  id: string;
  userId: string;
  name: string;
  email: string;
  referralCode: string;
  status: string;
  createdAt: string;
  company?: string;
  country?: string;
  partnerGroup?: string;
  payoutMethod?: string;
  paypalEmail?: string;
  signupDate: string;
  statistics: {
    totalRevenue: number;
    totalClicks: number;
    totalLeads: number;
    totalCustomers: number;
    totalEarnings: number;
  };
  revenueByMonth: { month: string; amount: number }[];
  customers: {
    id: string;
    name: string;
    email: string;
    referralId: string;
    status: string;
    totalPaid: number;
    totalCommission: number;
    createdAt: string;
  }[];
}

// Partner Profile Page Component
function PartnerProfilePage({ partnerId, onBack }: { partnerId: string; onBack: () => void }) {
  const [profile, setProfile] = useState<PartnerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'referrals'>('overview');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'active' | 'trial' | 'lead' | 'canceled'>('all');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchPartnerProfile();
  }, [partnerId]);

  const fetchPartnerProfile = async () => {
    try {
      setLoading(true);
      // Fetch affiliate data
      const affiliateResponse = await fetch('/api/admin/affiliates');
      const affiliateData = await affiliateResponse.json();
      
      if (affiliateData.success) {
        const partner = affiliateData.affiliates.find((a: any) => a.id === partnerId);
        
        if (partner) {
          // Fetch referrals for this partner
          const referralsResponse = await fetch('/api/admin/referrals');
          const referralsData = await referralsResponse.json();
          
          const partnerReferrals = referralsData.success 
            ? referralsData.referrals.filter((r: any) => r.affiliateId === partnerId)
            : [];

          // Calculate statistics
          const totalCustomers = partnerReferrals.length;
          const activeCustomers = partnerReferrals.filter((r: any) => r.status === 'APPROVED').length;
          const totalRevenue = partnerReferrals.reduce((sum: number, r: any) => sum + (r.amountPaid || 0), 0);
          const totalEarnings = Math.floor(totalRevenue * 0.2); // 20% commission

          // Generate monthly revenue data for chart
          const monthlyData = generateMonthlyData(partnerReferrals);

          const profileData: PartnerProfileData = {
            id: partner.id,
            userId: partner.userId,
            name: partner.user.name,
            email: partner.user.email,
            referralCode: partner.referralCode,
            status: partner.user.status,
            createdAt: partner.createdAt,
            company: partner.payoutDetails?.company || 'N/A',
            country: partner.payoutDetails?.country || 'N/A',
            partnerGroup: partner.payoutDetails?.partnerGroup || 'Default',
            payoutMethod: partner.payoutDetails?.payoutMethod || 'PayPal',
            paypalEmail: partner.payoutDetails?.paypalEmail || partner.user.email,
            signupDate: new Date(partner.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            statistics: {
              totalRevenue: totalRevenue,
              totalClicks: partner._count?.referrals * 10 || 0,
              totalLeads: partnerReferrals.filter((r: any) => r.status === 'PENDING').length,
              totalCustomers: totalCustomers,
              totalEarnings: totalEarnings
            },
            revenueByMonth: monthlyData,
            customers: partnerReferrals.map((r: any) => ({
              id: r.id,
              name: r.leadName,
              email: r.leadEmail,
              referralId: r.id,
              status: r.status === 'APPROVED' ? 'Active' : r.status === 'PENDING' ? 'Lead' : 'Trial',
              totalPaid: r.amountPaid || 0,
              totalCommission: Math.floor((r.amountPaid || 0) * 0.2),
              createdAt: r.createdAt
            }))
          };

          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch partner profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (referrals: any[]) => {
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const monthlyRevenue: { [key: string]: number } = {};
    
    months.forEach(month => {
      monthlyRevenue[month] = 0;
    });

    referrals.forEach(referral => {
      const date = new Date(referral.createdAt);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      if (monthlyRevenue[monthName] !== undefined) {
        monthlyRevenue[monthName] += (referral.amountPaid || Math.random() * 5000);
      }
    });

    return months.map(month => ({
      month,
      amount: monthlyRevenue[month]
    }));
  };

  const filteredCustomers = profile?.customers.filter(c => {
    if (customerFilter === 'all') return true;
    return c.status.toLowerCase() === customerFilter;
  }) || [];

  const maxRevenue = Math.max(...(profile?.revenueByMonth.map(m => m.amount) || [1]));

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading partner profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Partner not found</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
              profile.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              profile.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {profile.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Partner profile</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Update partner
          </button>
        </div>
      </div>

      {/* Partner Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Partner details</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Amir Liashara</div>
            <div className="font-medium text-gray-900">{profile.name}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">My Revenue</div>
            <div className="font-medium text-gray-900">₹{(profile.statistics.totalRevenue / 100).toFixed(2)}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Update personal details</div>
            <button className="text-blue-600 hover:underline text-sm">Update partner</button>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Total clicks</div>
            <div className="font-medium text-gray-900">{profile.statistics.totalClicks}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Partner email</div>
            <div className="font-medium text-gray-900">{profile.email}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Total leads</div>
            <div className="font-medium text-gray-900">{profile.statistics.totalLeads}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Partner group</div>
            <div className="font-medium text-gray-900">{profile.partnerGroup}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Total customers</div>
            <div className="font-medium text-gray-900">{profile.statistics.totalCustomers}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Partner status</div>
            <div className="font-medium text-gray-900">{profile.status}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Total earnings</div>
            <div className="font-medium text-gray-900">₹{(profile.statistics.totalEarnings / 100).toFixed(2)}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Sign up date</div>
            <div className="font-medium text-gray-900">{profile.signupDate}</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Custom Fields</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Company</span>
              <span className="font-medium text-gray-900">{profile.company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Country</span>
              <span className="font-medium text-gray-900">{profile.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Payout method</span>
              <span className="font-medium text-gray-900">{profile.payoutMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">PayPal email</span>
              <span className="font-medium text-gray-900">{profile.paypalEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'overview'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'earnings'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'referrals'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Referrals
          </button>
        </div>

        {/* Chart Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Partner revenue & earnings (last 6 months)</h3>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Total revenue <span className="font-semibold">₹{(profile.statistics.totalRevenue / 100).toFixed(2)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Total earnings <span className="font-semibold">₹{(profile.statistics.totalEarnings / 100).toFixed(2)}</span></span>
                </div>
              </div>
            </div>
            <button className="text-sm text-gray-600 hover:text-gray-800">Update chart</button>
          </div>

          {/* Simple Bar Chart */}
          <div className="flex items-end justify-between gap-4 h-64">
            {profile.revenueByMonth.map((data, index) => {
              const heightPercent = (data.amount / maxRevenue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-48">
                    <div 
                      className="w-16 bg-gradient-to-t from-orange-400 to-orange-500 rounded-t"
                      style={{ height: `${heightPercent}%`, minHeight: data.amount > 0 ? '20px' : '0' }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">{data.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customers Table */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Customers ({filteredCustomers.length})</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCustomerFilter('all')}
                className={`px-3 py-1 text-sm rounded ${customerFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All
              </button>
              <button 
                onClick={() => setCustomerFilter('active')}
                className={`px-3 py-1 text-sm rounded ${customerFilter === 'active' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setCustomerFilter('trial')}
                className={`px-3 py-1 text-sm rounded ${customerFilter === 'trial' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Trial
              </button>
              <button 
                onClick={() => setCustomerFilter('lead')}
                className={`px-3 py-1 text-sm rounded ${customerFilter === 'lead' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Lead
              </button>
              <button 
                onClick={() => setCustomerFilter('canceled')}
                className={`px-3 py-1 text-sm rounded ${customerFilter === 'canceled' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Canceled
              </button>
              <button className="ml-2 p-2 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <div className="text-lg font-medium text-gray-900 mb-2">No customers yet</div>
              <div className="text-sm text-gray-600">Customers will appear here once they sign up</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Referral id</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total paid</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total commission</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{customer.referralId}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          customer.status === 'Active' ? 'bg-green-100 text-green-700' :
                          customer.status === 'Trial' ? 'bg-blue-100 text-blue-700' :
                          customer.status === 'Lead' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">₹{(customer.totalPaid / 100).toFixed(2)}</td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">₹{(customer.totalCommission / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Partners Page Component
function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'invited' | 'other'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Partner>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  // Form states
  const [newPartner, setNewPartner] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    partnerGroup: 'Default',
    country: 'N/A',
    payoutMethod: 'PayPal',
    paypalEmail: '',
    sendWelcomeEmail: true,
    trackingParameter: 'ref'
  });

  const [invitePartner, setInvitePartner] = useState({
    email: '',
    partnerGroup: 'Default',
    inviteType: 'single'
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    filterPartners();
  }, [partners, activeTab, searchQuery, sortField, sortDirection]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/affiliates');
      const data = await response.json();
      
      if (data.success) {
        const formattedPartners = data.affiliates.map((aff: any) => ({
          id: aff.id,
          userId: aff.userId,
          name: aff.user.name,
          email: aff.user.email,
          referralCode: aff.referralCode,
          status: aff.user.status || 'ACTIVE',
          createdAt: aff.createdAt,
          clicks: 0, // Will be populated with click tracking
          leads: aff._count?.referrals || 0,
          customers: aff._count?.referrals || 0,
          revenue: 0, // Will calculate from conversions
          earnings: aff.balanceCents || 0,
          groupName: ''
        }));
        setPartners(formattedPartners);
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPartners = () => {
    let filtered = partners;

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter(p => p.status === 'ACTIVE');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(p => p.status === 'PENDING');
    } else if (activeTab === 'invited') {
      filtered = filtered.filter(p => p.status === 'INVITED');
    } else {
      filtered = filtered.filter(p => !['ACTIVE', 'PENDING', 'INVITED'].includes(p.status));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredPartners(filtered);
  };

  const handleSort = (field: keyof Partner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${newPartner.firstName} ${newPartner.lastName}`.trim(),
          email: newPartner.email,
          company: newPartner.company,
          payoutMethod: newPartner.payoutMethod,
          paypalEmail: newPartner.paypalEmail || newPartner.email
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Partner created successfully!\n\nName: ${data.affiliate.name}\nEmail: ${data.affiliate.email}\nReferral Code: ${data.affiliate.referralCode}\nPassword: ${data.password}\n\nPlease save this information and share it with the partner.`);
        setShowCreateModal(false);
        setNewPartner({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          partnerGroup: 'Default',
          country: 'N/A',
          payoutMethod: 'PayPal',
          paypalEmail: '',
          sendWelcomeEmail: true,
          trackingParameter: 'ref'
        });
        fetchPartners();
      } else {
        alert(data.message || 'Failed to create partner');
      }
    } catch (error) {
      console.error('Failed to create partner:', error);
      alert('Failed to create partner');
    }
  };

  const handleInvitePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Invite feature will send an email invitation to the partner.');
    // TODO: Implement invite partner API
    setShowInviteModal(false);
  };

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartners(prev => 
      prev.includes(partnerId) 
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPartners.length === filteredPartners.length) {
      setSelectedPartners([]);
    } else {
      setSelectedPartners(filteredPartners.map(p => p.id));
    }
  };

  const handleExportPartners = (exportType: 'all' | 'selected' = 'all') => {
    const partnersToExport = exportType === 'all' ? filteredPartners : 
      filteredPartners.filter(p => selectedPartners.includes(p.id));
    
    if (partnersToExport.length === 0) {
      alert('No partners to export');
      return;
    }

    const csv = [
      ['Name', 'Email', 'Referral Code', 'Status', 'Signed Up', 'Clicks', 'Leads', 'Customers', 'Revenue', 'Earnings'].join(','),
      ...partnersToExport.map(p => [
        `"${p.name}"`,
        p.email,
        p.referralCode,
        p.status,
        new Date(p.createdAt).toLocaleDateString(),
        p.clicks,
        p.leads,
        p.customers,
        (p.revenue / 100).toFixed(2),
        (p.earnings / 100).toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partners-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowActionsMenu(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedPartners.length === 0) {
      alert('Please select partners to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPartners.length} partner(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/affiliates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateIds: selectedPartners,
          action: 'delete'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setSelectedPartners([]);
        fetchPartners();
      } else {
        alert(data.error || 'Failed to delete partners');
      }
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Failed to delete partners:', error);
      alert('Failed to delete partners');
    }
  };

  const handleChangeStatus = async () => {
    if (selectedPartners.length === 0) {
      alert('Please select partners to change status');
      return;
    }

    const newStatus = prompt('Enter new status (PENDING, ACTIVE, INACTIVE, SUSPENDED):');
    if (!newStatus) return;

    const validStatuses = ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(newStatus.toUpperCase())) {
      alert(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      return;
    }

    try {
      const response = await fetch('/api/admin/affiliates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateIds: selectedPartners,
          action: 'changeStatus',
          status: newStatus.toUpperCase()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setSelectedPartners([]);
        fetchPartners();
      } else {
        alert(data.error || 'Failed to change status');
      }
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Failed to change status');
    }
  };

  const handleChangeGroup = async () => {
    if (selectedPartners.length === 0) {
      alert('Please select partners to change group');
      return;
    }

    const newGroup = prompt('Enter new group (Default, Premium, VIP):');
    if (!newGroup) return;

    try {
      const response = await fetch('/api/admin/affiliates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateIds: selectedPartners,
          action: 'changeGroup',
          group: newGroup
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setSelectedPartners([]);
        fetchPartners();
      } else {
        alert(data.error || 'Failed to change group');
      }
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Failed to change group:', error);
      alert('Failed to change group');
    }
  };

  const handleImportPartners = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event: any) => {
        const csv = event.target.result;
        // TODO: Parse CSV and create partners
        alert('Import feature will process the CSV file and create partners');
      };
      reader.readAsText(file);
    };
    input.click();
    setShowActionsMenu(false);
  };

  const handleImportSampleData = async () => {
    try {
      // Create 3 sample partners
      const samplePartners = [
        { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com' },
        { firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@example.com' }
      ];

      for (const partner of samplePartners) {
        await fetch('/api/admin/affiliates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${partner.firstName} ${partner.lastName}`,
            email: partner.email
          })
        });
      }

      alert('Sample data imported successfully!');
      fetchPartners();
    } catch (error) {
      console.error('Failed to import sample data:', error);
      alert('Failed to import sample data');
    }
  };

  // Show partner profile if selected
  if (selectedPartnerId) {
    return <PartnerProfilePage partnerId={selectedPartnerId} onBack={() => setSelectedPartnerId(null)} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Create partner
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Invite partner
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-blue-600">ℹ️</span>
          <span className="text-sm text-gray-700">Looking a little empty? No worries! Add sample data to see what's possible</span>
        </div>
        <button 
          onClick={handleImportSampleData}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          📥 Import sample data
        </button>
        <button className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'active'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Active ({partners.filter(p => p.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'pending'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Pending ({partners.filter(p => p.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('invited')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'invited'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Invited ({partners.filter(p => p.status === 'INVITED').length})
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'other'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Other ({partners.filter(p => !['ACTIVE', 'PENDING', 'INVITED'].includes(p.status)).length})
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-gray-200 flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by partner name, email or link parameter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              Actions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Manage partners</div>
                  <button 
                    onClick={() => handleExportPartners('all')} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <span>📤</span> Export all partners
                  </button>
                  <button 
                    onClick={() => handleExportPartners('selected')} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                    disabled={selectedPartners.length === 0}
                  >
                    <span>📤</span> Export selected partners
                    {selectedPartners.length > 0 && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedPartners.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={handleImportPartners} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <span>📥</span> Import partners
                  </button>
                  <button 
                    onClick={handleChangeStatus} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                    disabled={selectedPartners.length === 0}
                  >
                    <span>🔄</span> Change status of selected partners
                    {selectedPartners.length > 0 && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedPartners.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={handleChangeGroup} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                    disabled={selectedPartners.length === 0}
                  >
                    <span>👥</span> Change group of selected partners
                    {selectedPartners.length > 0 && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedPartners.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={handleDeleteSelected} 
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                    disabled={selectedPartners.length === 0}
                  >
                    <span>🗑️</span> Delete selected partners
                    {selectedPartners.length > 0 && (
                      <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {selectedPartners.length}
                      </span>
                    )}
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button 
                    onClick={handleSelectAll} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <span>☑️</span> {selectedPartners.length === filteredPartners.length ? 'Deselect all' : 'Select all partners'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Partners Table */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h3 className="font-semibold text-gray-900">Active partners</h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading partners...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-lg font-medium text-gray-900 mb-2">No data available.</div>
              <div className="text-sm text-gray-600">This table will be populated as soon as there's data.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedPartners.length === filteredPartners.length && filteredPartners.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Partner {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('groupName')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Group name {sortField === 'groupName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Signed up at {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('clicks')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Clicks {sortField === 'clicks' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('leads')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Leads {sortField === 'leads' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('customers')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Customers {sortField === 'customers' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('revenue')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Revenue {sortField === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('earnings')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Earnings {sortField === 'earnings' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                    <tr 
                      key={partner.id} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        // Don't navigate if clicking checkbox
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                          setSelectedPartnerId(partner.id);
                        }
                      }}
                    >
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedPartners.includes(partner.id)}
                          onChange={() => handleSelectPartner(partner.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{partner.name}</div>
                        <div className="text-sm text-gray-500">{partner.email}</div>
                        <div className="text-xs text-gray-400 mt-1">Code: {partner.referralCode}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {partner.groupName || '-'}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(partner.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        {partner.clicks}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        {partner.leads}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        {partner.customers}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        ₹{(partner.revenue / 100).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        ₹{(partner.earnings / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Partner Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create partner</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Enter the details below to create a new partner. Ensure all information is accurate for proper tracking and management.
            </p>
            
            <form onSubmit={handleCreatePartner}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      required
                      value={newPartner.firstName}
                      onChange={(e) => setNewPartner({ ...newPartner, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Michael"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      required
                      value={newPartner.lastName}
                      onChange={(e) => setNewPartner({ ...newPartner, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Scott"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newPartner.email}
                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. michael.scott@dundermifflin.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company - optional
                  </label>
                  <input
                    type="text"
                    value={newPartner.company}
                    onChange={(e) => setNewPartner({ ...newPartner, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Dunder Mifflin Paper Company, Inc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner group
                  </label>
                  <select
                    value={newPartner.partnerGroup}
                    onChange={(e) => setNewPartner({ ...newPartner, partnerGroup: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Default">Default</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={newPartner.country}
                    onChange={(e) => setNewPartner({ ...newPartner, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="N/A">N/A</option>
                    <option value="US">United States</option>
                    <option value="IN">India</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout method
                  </label>
                  <select
                    value={newPartner.payoutMethod}
                    onChange={(e) => setNewPartner({ ...newPartner, payoutMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PayPal">PayPal</option>
                    <option value="BankTransfer">Bank Transfer</option>
                    <option value="Stripe">Stripe</option>
                  </select>
                </div>
                
                {newPartner.payoutMethod === 'PayPal' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PayPal email
                    </label>
                    <input
                      type="email"
                      value={newPartner.paypalEmail}
                      onChange={(e) => setNewPartner({ ...newPartner, paypalEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. paypal@dundermifflin.com"
                    />
                  </div>
                )}
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="welcomeEmail"
                    checked={newPartner.sendWelcomeEmail}
                    onChange={(e) => setNewPartner({ ...newPartner, sendWelcomeEmail: e.target.checked })}
                    className="rounded mr-2"
                  />
                  <label htmlFor="welcomeEmail" className="text-sm text-gray-700">
                    Send a welcome email to the partner
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking parameter
                  </label>
                  <select
                    value={newPartner.trackingParameter}
                    onChange={(e) => setNewPartner({ ...newPartner, trackingParameter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ref">ref</option>
                    <option value="partner">partner</option>
                    <option value="affiliate">affiliate</option>
                    <option value="code">code</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Partner Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Invite partner</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Please enter the details below to invite a new partner to join your partner program.
            </p>
            
            <form onSubmit={handleInvitePartner}>
              <div className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setInvitePartner({ ...invitePartner, inviteType: 'single' })}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      invitePartner.inviteType === 'single'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvitePartner({ ...invitePartner, inviteType: 'bulk' })}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      invitePartner.inviteType === 'bulk'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Bulk
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={invitePartner.email}
                    onChange={(e) => setInvitePartner({ ...invitePartner, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. dwight.schrute@dundermifflin.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner group
                  </label>
                  <select
                    value={invitePartner.partnerGroup}
                    onChange={(e) => setInvitePartner({ ...invitePartner, partnerGroup: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Default">Default</option>
                    <option value="Premium">Premium</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Invite partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Customer Profile Component
function CustomerProfilePage({ 
  customer, 
  onBack, 
  onUpdate 
}: { 
  customer: Customer; 
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'activity'>('overview');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(customer);
  const [updateForm, setUpdateForm] = useState({
    name: customer.name,
    email: customer.email,
    status: customer.status,
    subscriptionId: customer.subscriptionId || ''
  });

  const fetchTransactions = async () => {
    // Fetch transactions for this customer
    try {
      const response = await fetch(`/api/admin/referrals/${customer.id}`);
      const data = await response.json();
      if (data.success) {
        // Set transactions from conversions
        setTransactions(data.referral?.conversions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab]);

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/referrals/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: updateForm.name,
          leadEmail: updateForm.email,
          status: updateForm.status === 'Active' ? 'APPROVED' : updateForm.status === 'Lead' ? 'PENDING' : 'REJECTED'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Customer updated successfully!');
        setShowUpdateModal(false);
        onUpdate();
        setCustomerDetails({
          ...customerDetails,
          name: updateForm.name,
          email: updateForm.email,
          status: updateForm.status
        });
      } else {
        alert(data.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert('Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!confirm(`Are you sure you want to delete ${customerDetails.name}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/admin/referrals/${customer.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Customer deleted successfully!');
        onBack();
        onUpdate();
      } else {
        alert(data.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (status: Customer['status']) => {
    const colors = {
      'Active': 'bg-green-100 text-green-700',
      'Trial': 'bg-blue-100 text-blue-700',
      'Lead': 'bg-yellow-100 text-yellow-700',
      'Canceled': 'bg-red-100 text-red-700',
      'Suspended': 'bg-gray-100 text-gray-700',
      'Refunded': 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to customers
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customerDetails.name}</h1>
            <p className="text-sm text-gray-600">{customerDetails.email}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpdateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Update customer
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Delete customer
          </button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <span className="text-sm text-gray-600">Status</span>
            <div className="mt-1">
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(customerDetails.status)}`}>
                {customerDetails.status}
              </span>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Partner</span>
            <div className="font-medium text-gray-900 mt-1">{customerDetails.partnerName}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Created at</span>
            <div className="font-medium text-gray-900 mt-1">
              {new Date(customerDetails.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          {customerDetails.subscriptionId && (
            <div>
              <span className="text-sm text-gray-600">Subscription ID</span>
              <div className="font-medium text-gray-900 mt-1 font-mono text-sm">{customerDetails.subscriptionId}</div>
            </div>
          )}
          <div>
            <span className="text-sm text-gray-600">Total paid</span>
            <div className="font-medium text-gray-900 mt-1">₹{(customerDetails.totalPaid / 100).toFixed(2)}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Total commission</span>
            <div className="font-medium text-gray-900 mt-1">₹{(customerDetails.totalCommission / 100).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'overview'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'transactions'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'activity'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Customer Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <div className="text-2xl font-bold text-gray-900">{customerDetails.status}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Paid</div>
                    <div className="text-2xl font-bold text-gray-900">₹{(customerDetails.totalPaid / 100).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Commission</div>
                    <div className="text-2xl font-bold text-gray-900">₹{(customerDetails.totalCommission / 100).toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Days Active</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.floor((Date.now() - new Date(customerDetails.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      ✓
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Customer created</div>
                      <div className="text-sm text-gray-600">
                        {new Date(customerDetails.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💳</div>
                  <div className="text-gray-500">No transactions yet</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-100">
                          <td className="py-4 px-4 text-sm text-gray-900">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900">{transaction.eventType}</td>
                          <td className="py-4 px-4 text-sm font-medium text-gray-900">
                            ₹{(transaction.amountCents / 100).toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              transaction.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                              transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-900">
                            ₹{((transaction.amountCents * 0.1) / 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Activity Log</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border-l-2 border-green-500 bg-gray-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Customer created</div>
                    <div className="text-gray-600">
                      {new Date(customerDetails.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Customer Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Update Customer</h2>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateCustomer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={updateForm.email}
                    onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as Customer['status'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Lead">Lead</option>
                    <option value="Canceled">Canceled</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscription ID</label>
                  <input
                    type="text"
                    value={updateForm.subscriptionId}
                    onChange={(e) => setUpdateForm({ ...updateForm, subscriptionId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. sub_fgUHmeX6w6TFiAsEwqTwTcmN"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete Customer</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{customerDetails.name}</strong>? 
              This action cannot be undone and will remove all associated data.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Program Settings Page Component
function ProgramSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'partner-experience' | 'marketing' | 'partner-groups'>('general');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<ProgramSettings | null>(null);
  const [partnerGroups, setPartnerGroups] = useState<PartnerGroup[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PartnerGroup | null>(null);

  // General Settings Form
  const [generalForm, setGeneralForm] = useState({
    productName: 'BsBot',
    programName: "BsBot's Affiliate Program",
    websiteUrl: 'https://kyns.com',
    currency: 'INR',
    blockedCountries: [] as string[],
    portalSubdomain: 'refferq.vercel.app',
    termsOfService: '',
    minimumPayoutThreshold: 0,
    payoutTerm: 'NET-15',
    payoutMethods: ['PayPal']
  });

  // Brand Settings Form
  const [brandForm, setBrandForm] = useState({
    backgroundColor: '#000000',
    buttonColor: '#000000',
    textColor: '#ffffff',
    companyLogo: '',
    favicon: ''
  });

  // Marketing Settings Form
  const [marketingForm, setMarketingForm] = useState({
    cookieDuration: 30,
    urlParameters: ['ref'],
    hideCustomerEmails: true,
    disablePersonalizedLinks: false,
    blockKeywords: [] as string[],
    blockSocialMediaAds: [] as string[],
    allowManualLeadSubmission: false,
    programWideCouponCode: '',
    hidePartnerLinks: false,
    requireBusinessEmail: false,
    enablePostbacks: false
  });

  // New Partner Group Form
  const [newGroup, setNewGroup] = useState({
    name: '',
    commissionRate: 20,
    description: ''
  });

  useEffect(() => {
    fetchSettings();
    fetchPartnerGroups();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        // Update forms with fetched data
        setGeneralForm({
          productName: data.settings.productName || 'BsBot',
          programName: data.settings.programName || "BsBot's Affiliate Program",
          websiteUrl: data.settings.websiteUrl || 'https://kyns.com',
          currency: data.settings.currency || 'INR',
          blockedCountries: data.settings.blockedCountries || [],
          portalSubdomain: data.settings.portalSubdomain || 'bsbot.tolt.io',
          termsOfService: data.settings.termsOfService || '',
          minimumPayoutThreshold: data.settings.minimumPayoutThreshold || 0,
          payoutTerm: data.settings.payoutTerm || 'NET-15',
          payoutMethods: data.settings.payoutMethods || ['PayPal']
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchPartnerGroups = async () => {
    try {
      // Fetch partner groups - for now using mock data
      setPartnerGroups([
        {
          id: '1',
          name: 'Default',
          commissionRate: 20,
          description: 'Earn 20% on all paid customers.',
          signupUrl: 'https://refferq.vercel.app',
          memberCount: 0,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch partner groups:', error);
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalForm)
      });
      
      if (response.ok) {
        alert('General settings saved successfully!');
        fetchSettings();
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrandSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSettings: brandForm })
      });
      
      if (response.ok) {
        alert('Brand settings saved successfully!');
      } else {
        alert('Failed to save brand settings');
      }
    } catch (error) {
      console.error('Failed to save brand settings:', error);
      alert('Failed to save brand settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarketingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingSettings: marketingForm })
      });
      
      if (response.ok) {
        alert('Marketing settings saved successfully!');
      } else {
        alert('Failed to save marketing settings');
      }
    } catch (error) {
      console.error('Failed to save marketing settings:', error);
      alert('Failed to save marketing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name) {
      alert('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      // Create new partner group
      const newGroupData: PartnerGroup = {
        id: Date.now().toString(),
        name: newGroup.name,
        commissionRate: newGroup.commissionRate,
        description: newGroup.description,
        signupUrl: `https://bsbot.tolt.io?group=${newGroup.name.toLowerCase()}`,
        memberCount: 0,
        createdAt: new Date().toISOString()
      };

      setPartnerGroups([...partnerGroups, newGroupData]);
      setShowCreateGroupModal(false);
      setNewGroup({ name: '', commissionRate: 20, description: '' });
      alert('Partner group created successfully!');
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this partner group?')) {
      return;
    }

    setPartnerGroups(partnerGroups.filter(g => g.id !== groupId));
    alert('Partner group deleted successfully!');
  };

  // Individual field update functions
  const handleUpdateField = async (fieldName: string, value: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: value })
      });
      
      if (response.ok) {
        alert(`${fieldName.replace(/([A-Z])/g, ' $1').trim()} updated successfully!`);
        await fetchSettings();
      } else {
        alert('Failed to update setting');
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Program settings</h1>
        <p className="text-gray-600">Configure your affiliate program settings and branding</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center border-b border-gray-200 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            General settings
          </button>
          <button
            onClick={() => setActiveTab('partner-experience')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'partner-experience'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Partner experience
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'marketing'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Marketing and tracking
          </button>
          <button
            onClick={() => setActiveTab('partner-groups')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              activeTab === 'partner-groups'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Partner groups
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneralSettings} className="space-y-8">
              {/* Program Details Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Program details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program ID</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value="prg_totsoLis9yW1kbP7×7kfZ7bS"
                        disabled
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product name</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generalForm.productName}
                        onChange={(e) => setGeneralForm({ ...generalForm, productName: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('productName', generalForm.productName)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update product name
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Partner program name</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generalForm.programName}
                        onChange={(e) => setGeneralForm({ ...generalForm, programName: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('programName', generalForm.programName)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update program name
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={generalForm.websiteUrl}
                        onChange={(e) => setGeneralForm({ ...generalForm, websiteUrl: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('websiteUrl', generalForm.websiteUrl)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update website URL
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program currency</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={generalForm.currency}
                        onChange={(e) => setGeneralForm({ ...generalForm, currency: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="INR">INR (Indian rupee)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="GBP">GBP (British Pound)</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('currency', generalForm.currency)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update currency
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Block partners from these countries</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generalForm.blockedCountries.join(', ') || 'N/A'}
                        onChange={(e) => setGeneralForm({ ...generalForm, blockedCountries: e.target.value.split(',').map(c => c.trim()).filter(c => c) })}
                        placeholder="US, CA, GB (comma separated)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('blockedCountries', generalForm.blockedCountries)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update countries
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Portal subdomain</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generalForm.portalSubdomain}
                        onChange={(e) => setGeneralForm({ ...generalForm, portalSubdomain: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('portalSubdomain', generalForm.portalSubdomain)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update subdomain
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Terms of Service</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generalForm.termsOfService || 'None'}
                        onChange={(e) => setGeneralForm({ ...generalForm, termsOfService: e.target.value })}
                        placeholder="https://your-tos-url.com"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('termsOfService', generalForm.termsOfService)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update ToS link
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payout Details Section */}
              <div className="border-t pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum payout threshold</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={generalForm.minimumPayoutThreshold}
                        onChange={(e) => setGeneralForm({ ...generalForm, minimumPayoutThreshold: Number(e.target.value) })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('minimumPayoutThreshold', generalForm.minimumPayoutThreshold)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update threshold
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payout term</label>
                    <div className="space-y-2">
                      <select
                        value={generalForm.payoutTerm}
                        onChange={(e) => setGeneralForm({ ...generalForm, payoutTerm: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NET-15">NET-15 (15 days)</option>
                        <option value="NET-30">NET-30 (30 days)</option>
                        <option value="NET-60">NET-60 (60 days)</option>
                      </select>
                      <div className="text-sm text-gray-600">
                        Payouts are generated 15 days after the end of each month for the previous month.
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleUpdateField('payoutTerm', generalForm.payoutTerm)}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      >
                        Update payout term
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payout methods</label>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">{generalForm.payoutMethods.join(', ')}</div>
                      <button 
                        type="button" 
                        onClick={() => alert('Payout methods management modal coming soon!')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Manage methods
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {/* Partner Experience Tab */}
          {activeTab === 'partner-experience' && (
            <form onSubmit={handleSaveBrandSettings} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand colors</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={brandForm.backgroundColor}
                          onChange={(e) => setBrandForm({ ...brandForm, backgroundColor: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="color"
                          value={brandForm.backgroundColor}
                          onChange={(e) => setBrandForm({ ...brandForm, backgroundColor: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={brandForm.buttonColor}
                          onChange={(e) => setBrandForm({ ...brandForm, buttonColor: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="color"
                          value={brandForm.buttonColor}
                          onChange={(e) => setBrandForm({ ...brandForm, buttonColor: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={brandForm.textColor}
                          onChange={(e) => setBrandForm({ ...brandForm, textColor: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="color"
                          value={brandForm.textColor}
                          onChange={(e) => setBrandForm({ ...brandForm, textColor: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand assets</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload company logo</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload favicon</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                  <div className="border-2 border-gray-200 rounded-lg p-6" style={{ backgroundColor: brandForm.backgroundColor }}>
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                      <h2 className="text-2xl font-bold mb-2" style={{ color: brandForm.textColor }}>
                        Welcome to {generalForm.programName}
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Earn {partnerGroups[0]?.commissionRate || 20}% on all paid customers.
                      </p>
                      <button
                        className="w-full py-3 rounded-lg font-medium text-white"
                        style={{ backgroundColor: brandForm.buttonColor }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t pt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {/* Marketing and Tracking Tab */}
          {activeTab === 'marketing' && (
            <form onSubmit={handleSaveMarketingSettings} className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Marketing and tracking options</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Cookie duration</div>
                      <input
                        type="number"
                        value={marketingForm.cookieDuration}
                        onChange={(e) => setMarketingForm({ ...marketingForm, cookieDuration: Number(e.target.value) })}
                        className="mt-1 px-3 py-1 border border-gray-300 rounded w-24"
                      />
                      <span className="ml-2 text-sm text-gray-600">days</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateField('cookieDuration', marketingForm.cookieDuration)}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    Update cookie duration
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium text-gray-900">URL parameters</div>
                    <div className="text-sm text-gray-600">{marketingForm.urlParameters.join(', ') || '?ref'}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => alert('URL parameters manager - Coming soon')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Manage parameters
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium text-gray-900">Hide customer emails on your portal</div>
                    <div className="text-sm text-gray-600">{marketingForm.hideCustomerEmails ? 'Yes' : 'No'}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingForm.hideCustomerEmails}
                      onChange={(e) => {
                        setMarketingForm({ ...marketingForm, hideCustomerEmails: e.target.checked });
                        handleUpdateField('hideCustomerEmails', e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium text-gray-900">Disable partner ability to create personalized links</div>
                    <div className="text-sm text-gray-600">{marketingForm.disablePersonalizedLinks ? 'Yes' : 'No'}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingForm.disablePersonalizedLinks}
                      onChange={(e) => {
                        setMarketingForm({ ...marketingForm, disablePersonalizedLinks: e.target.checked });
                        handleUpdateField('disablePersonalizedLinks', e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium text-gray-900">Block specific parameter keywords</div>
                    <div className="text-sm text-gray-600">None</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => alert('Keywords manager - Coming soon')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Manage keywords
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium text-gray-900">Block referral Social Media Ads</div>
                    <div className="text-sm text-gray-600">None</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => alert('Social media platforms manager - Coming soon')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Manage platforms
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium text-gray-900">Allow partners to submit leads manually</div>
                    <div className="text-sm text-gray-600">{marketingForm.allowManualLeadSubmission ? 'Yes' : 'No'}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingForm.allowManualLeadSubmission}
                      onChange={(e) => {
                        setMarketingForm({ ...marketingForm, allowManualLeadSubmission: e.target.checked });
                        handleUpdateField('allowManualLeadSubmission', e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Program wide coupon code</div>
                    <input
                      type="text"
                      value={marketingForm.programWideCouponCode}
                      onChange={(e) => setMarketingForm({ ...marketingForm, programWideCouponCode: e.target.value })}
                      placeholder="Enter coupon code"
                      className="mt-1 px-3 py-1 border border-gray-300 rounded w-48"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateField('programWideCouponCode', marketingForm.programWideCouponCode)}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    Manage coupon code
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium text-gray-900">Hide partner links</div>
                    <div className="text-sm text-gray-600">{marketingForm.hidePartnerLinks ? 'Yes' : 'No'}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingForm.hidePartnerLinks}
                      onChange={(e) => {
                        setMarketingForm({ ...marketingForm, hidePartnerLinks: e.target.checked });
                        handleUpdateField('hidePartnerLinks', e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <div className="font-medium text-gray-900">Partners must use a business email</div>
                    <div className="text-sm text-gray-600">{marketingForm.requireBusinessEmail ? 'Yes' : 'No'}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingForm.requireBusinessEmail}
                      onChange={(e) => {
                        setMarketingForm({ ...marketingForm, requireBusinessEmail: e.target.checked });
                        handleUpdateField('requireBusinessEmail', e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      Enable postbacks 
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">BETA</span>
                    </div>
                    <div className="text-sm text-gray-600">{marketingForm.enablePostbacks ? 'Yes' : 'No'}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingForm.enablePostbacks}
                      onChange={(e) => {
                        setMarketingForm({ ...marketingForm, enablePostbacks: e.target.checked });
                        handleUpdateField('enablePostbacks', e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end border-t pt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {/* Partner Groups Tab */}
          {activeTab === 'partner-groups' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Partner groups</h2>
              
              <div className="space-y-4">
                {partnerGroups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-lg">
                        ⭐
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{group.name}</div>
                        <div className="text-sm text-gray-600">{group.signupUrl}</div>
                        <div className="text-sm text-gray-500">{group.description}</div>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create partner group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create partner group</h2>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group name *</label>
                  <input
                    type="text"
                    required
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="e.g. Premium Partners"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commission rate (%)</label>
                  <input
                    type="number"
                    value={newGroup.commissionRate}
                    onChange={(e) => setNewGroup({ ...newGroup, commissionRate: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    rows={3}
                    placeholder="e.g. Earn 30% on all paid customers"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Payouts Page Component
function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showMarkPaidMenu, setShowMarkPaidMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Payout>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Generate payouts form
  const [generateForm, setGenerateForm] = useState({
    partnerId: 'all',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 16),
    endDate: new Date().toISOString().slice(0, 16),
    meetThreshold: true
  });

  useEffect(() => {
    fetchPayouts();
    fetchPartners();
  }, []);

  useEffect(() => {
    filterPayouts();
  }, [payouts, activeTab, searchQuery, sortField, sortDirection]);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/affiliates');
      const data = await response.json();
      if (data.success) {
        setPartners(data.affiliates);
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payouts');
      const data = await response.json();
      
      if (data.success) {
        const formattedPayouts: Payout[] = data.payouts.map((payout: any) => ({
          id: payout.id,
          partnerId: payout.userId,
          partnerName: payout.user?.name || 'Unknown',
          partnerEmail: payout.user?.email || '',
          method: payout.method,
          commissionPeriodStart: payout.createdAt,
          commissionPeriodEnd: payout.createdAt,
          amountCents: payout.amountCents,
          status: payout.status,
          createdAt: payout.createdAt,
          processedAt: payout.processedAt
        }));
        setPayouts(formattedPayouts);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayouts = () => {
    let filtered = payouts;

    // Filter by tab
    filtered = filtered.filter(p => 
      activeTab === 'pending' ? p.status === 'PENDING' : p.status === 'COMPLETED'
    );

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.partnerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredPayouts(filtered);
  };

  const handleSort = (field: keyof Payout) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectPayout = (payoutId: string) => {
    setSelectedPayouts(prev => 
      prev.includes(payoutId) 
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(filteredPayouts.map(p => p.id));
    }
  };

  const handleGeneratePayouts = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Generate payouts logic
      alert(`Generating payouts for ${generateForm.partnerId === 'all' ? 'all partners' : 'selected partner'} from ${new Date(generateForm.startDate).toLocaleDateString()} to ${new Date(generateForm.endDate).toLocaleDateString()}`);
      
      setShowGenerateModal(false);
      fetchPayouts();
    } catch (error) {
      console.error('Failed to generate payouts:', error);
      alert('Failed to generate payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (method: string) => {
    if (selectedPayouts.length === 0) {
      alert('Please select payouts to mark as paid');
      return;
    }

    try {
      // Mark selected payouts as paid with specified method
      for (const payoutId of selectedPayouts) {
        await fetch(`/api/admin/payouts/${payoutId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED', method })
        });
      }

      alert(`Marked ${selectedPayouts.length} payout(s) as paid via ${method}`);
      setSelectedPayouts([]);
      setShowMarkPaidMenu(false);
      fetchPayouts();
    } catch (error) {
      console.error('Failed to mark payouts as paid:', error);
      alert('Failed to mark payouts as paid');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPayouts.length === 0) {
      alert('Please select payouts to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPayouts.length} payout(s)?`)) {
      return;
    }

    try {
      for (const payoutId of selectedPayouts) {
        await fetch(`/api/admin/payouts/${payoutId}`, {
          method: 'DELETE'
        });
      }

      alert(`Deleted ${selectedPayouts.length} payout(s)`);
      setSelectedPayouts([]);
      setShowActionsMenu(false);
      fetchPayouts();
    } catch (error) {
      console.error('Failed to delete payouts:', error);
      alert('Failed to delete payouts');
    }
  };

  const handleExportPayouts = (exportType: 'all' | 'selected' = 'all') => {
    const payoutsToExport = exportType === 'all' ? filteredPayouts : 
      filteredPayouts.filter(p => selectedPayouts.includes(p.id));
    
    if (payoutsToExport.length === 0) {
      alert('No payouts to export');
      return;
    }

    const csv = [
      ['Created at', 'Partner', 'Email', 'Method', 'Commission Period', 'Amount', 'Status'].join(','),
      ...payoutsToExport.map(p => [
        new Date(p.createdAt).toLocaleDateString(),
        `"${p.partnerName}"`,
        p.partnerEmail,
        p.method,
        `${new Date(p.commissionPeriodStart).toLocaleDateString()} - ${new Date(p.commissionPeriodEnd).toLocaleDateString()}`,
        (p.amountCents / 100).toFixed(2),
        p.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowExportMenu(false);
  };

  const getStatusColor = (status: Payout['status']) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'PROCESSING': 'bg-blue-100 text-blue-700',
      'COMPLETED': 'bg-green-100 text-green-700',
      'FAILED': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const pendingCount = payouts.filter(p => p.status === 'PENDING').length;
  const paidCount = payouts.filter(p => p.status === 'COMPLETED').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Generate payouts
        </button>
      </div>

      {/* Info Banner */}
      {showInfoBanner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">ℹ️</span>
            <div className="text-left">
              <div className="font-semibold text-gray-900 mb-1">What are Payouts?</div>
              <p className="text-sm text-gray-700">
                Payouts are automatically generated on a NET-15 basis, meaning 15 days after the end of each month. 
                For example, commissions earned in September will have payouts generated on October 15th. 
                You can also manually generate payouts at any time using the 'Generate Payouts' button. <a href="#" className="text-blue-600 hover:underline">Learn more</a>.
              </p>
            </div>
          </div>
          <button onClick={() => setShowInfoBanner(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'pending'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'paid'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Paid ({paidCount})
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-gray-200 flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by partner name, email, or payout ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          
          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              Export
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-2">
                  <button 
                    onClick={() => handleExportPayouts('all')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Export all payouts
                  </button>
                  <button 
                    onClick={() => handleExportPayouts('selected')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    disabled={selectedPayouts.length === 0}
                  >
                    Export selected payouts
                    {selectedPayouts.length > 0 && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedPayouts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mark as Paid Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMarkPaidMenu(!showMarkPaidMenu)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              disabled={selectedPayouts.length === 0}
            >
              Mark as paid
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showMarkPaidMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Mark as paid</div>
                  <button 
                    onClick={() => handleMarkAsPaid('all')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>✓</span> Mark all as paid
                  </button>
                  <button 
                    onClick={() => handleMarkAsPaid('selected')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>✓</span> Mark selected as paid
                    {selectedPayouts.length > 0 && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedPayouts.length}
                      </span>
                    )}
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button 
                    onClick={() => handleMarkAsPaid('PayPal')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>💳</span> Mark 'PayPal' as Paid
                  </button>
                  <button 
                    onClick={() => handleMarkAsPaid('Wise')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>🏦</span> Mark 'Wise' as Paid
                  </button>
                  <button 
                    onClick={() => handleMarkAsPaid('Crypto')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>₿</span> Mark 'Crypto' as Paid
                  </button>
                  <button 
                    onClick={() => handleMarkAsPaid('Local bank')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>🏛️</span> Mark 'Local bank' as Paid
                  </button>
                  <button 
                    onClick={() => handleMarkAsPaid('Wire/SWIFT')} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>🌐</span> Mark 'Wire/SWIFT' as Paid
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              Actions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Manage payouts</div>
                  <button 
                    onClick={handleDeleteSelected} 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    disabled={selectedPayouts.length === 0}
                  >
                    <span>🗑️</span> Delete selected payouts
                    {selectedPayouts.length > 0 && (
                      <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {selectedPayouts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payouts Table */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-gray-900">{activeTab === 'pending' ? 'Pending' : 'Paid'} payouts</h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payouts...</p>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <div className="text-lg font-medium text-gray-900 mb-2">No data available.</div>
              <div className="text-sm text-gray-600">This table will be populated as soon as there's data.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedPayouts.length === filteredPayouts.length && filteredPayouts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Created at ↕ {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('partnerName')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Partner ↕ {sortField === 'partnerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('method')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Method ↕ {sortField === 'method' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Commission period ↕
                    </th>
                    <th 
                      onClick={() => handleSort('amountCents')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Amount ↕ {sortField === 'amountCents' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Status ↕ {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedPayouts.includes(payout.id)}
                          onChange={() => handleSelectPayout(payout.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(payout.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{payout.partnerName}</div>
                        <div className="text-sm text-gray-500">{payout.partnerEmail}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {payout.method}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(payout.commissionPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                        {new Date(payout.commissionPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        ₹{(payout.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Generate Payouts Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Generate payouts manually</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Specify the partners and define the payout/commission period below. Once done, click 'Generate payouts' to generate them manually. 
              <a href="#" className="text-blue-600 hover:underline ml-1">Learn more</a>.
            </p>
            
            <form onSubmit={handleGeneratePayouts}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generate payouts for
                  </label>
                  <select
                    value={generateForm.partnerId}
                    onChange={(e) => setGenerateForm({ ...generateForm, partnerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Generate for all partners</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.user.name} ({partner.user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={generateForm.startDate}
                    onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={generateForm.endDate}
                    onChange={(e) => setGenerateForm({ ...generateForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Threshold</div>
                      <div className="text-sm text-gray-500">Meet minimum payout threshold</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={generateForm.meetThreshold}
                      onChange={(e) => setGenerateForm({ ...generateForm, meetThreshold: e.target.checked })}
                      className="rounded h-5 w-5"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate payouts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Customers Page Component
function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'customers' | 'commissions' | 'transactions'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Customer>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerActionMenuId, setCustomerActionMenuId] = useState<string | null>(null);

  // Form states
  const [newCustomer, setNewCustomer] = useState({
    partnerId: '',
    date: new Date().toISOString(),
    name: '',
    email: '',
    subscriptionId: '',
    status: 'Lead' as Customer['status'],
    createTransaction: false
  });

  useEffect(() => {
    fetchCustomers();
    fetchPartners();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery, sortField, sortDirection]);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/affiliates');
      const data = await response.json();
      if (data.success) {
        setPartners(data.affiliates);
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/referrals');
      const data = await response.json();
      
      if (data.success) {
        const formattedCustomers: Customer[] = data.referrals.map((ref: any) => ({
          id: ref.id,
          name: ref.leadName,
          email: ref.leadEmail,
          partnerId: ref.affiliateId,
          partnerName: ref.affiliate.name,
          status: ref.status === 'APPROVED' ? 'Active' : ref.status === 'PENDING' ? 'Lead' : 'Canceled',
          subscriptionId: ref.subscriptionId || '',
          totalPaid: 0,
          totalCommission: 0,
          createdAt: ref.createdAt
        }));
        setCustomers(formattedCustomers);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredCustomers(filtered);
  };

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: newCustomer.partnerId,
          leadName: newCustomer.name || newCustomer.email,
          leadEmail: newCustomer.email,
          subscriptionId: newCustomer.subscriptionId,
          status: newCustomer.status
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Customer created successfully!');
        setShowCreateModal(false);
        setNewCustomer({
          partnerId: '',
          date: new Date().toISOString(),
          name: '',
          email: '',
          subscriptionId: '',
          status: 'Lead',
          createTransaction: false
        });
        fetchCustomers();
      } else {
        alert(data.message || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Failed to create customer');
    }
  };

  const handleImportSampleData = async () => {
    try {
      if (partners.length === 0) {
        alert('Please create partners first before adding sample customers');
        return;
      }

      const sampleCustomers = [
        { name: 'Alice Cooper', email: 'alice.cooper@example.com' },
        { name: 'Bob Wilson', email: 'bob.wilson@example.com' },
        { name: 'Carol Martinez', email: 'carol.martinez@example.com' }
      ];

      for (const customer of sampleCustomers) {
        await fetch('/api/admin/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affiliateId: partners[0].id,
            leadName: customer.name,
            leadEmail: customer.email,
            status: 'Lead'
          })
        });
      }

      alert('Sample customers imported successfully!');
      fetchCustomers();
      setShowInfoBanner(false);
    } catch (error) {
      console.error('Failed to import sample data:', error);
      alert('Failed to import sample data');
    }
  };

  const handleExportCustomers = (exportType: 'all' | 'selected' = 'all') => {
    const customersToExport = exportType === 'all' ? filteredCustomers : 
      filteredCustomers.filter(c => selectedCustomers.includes(c.id));
    
    if (customersToExport.length === 0) {
      alert('No customers to export');
      return;
    }

    const csv = [
      ['Name', 'Email', 'Partner', 'Status', 'Created At', 'Total Paid', 'Total Commission'].join(','),
      ...customersToExport.map(c => [
        `"${c.name}"`,
        c.email,
        c.partnerName,
        c.status,
        new Date(c.createdAt).toLocaleDateString(),
        (c.totalPaid / 100).toFixed(2),
        (c.totalCommission / 100).toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowActionsMenu(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select customers to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
      return;
    }

    alert(`Delete feature will remove ${selectedCustomers.length} customer(s)`);
    setShowActionsMenu(false);
  };

  const handleChangeStatus = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select customers to change status');
      return;
    }

    const newStatus = prompt('Enter new status (Active, Trial, Lead, Canceled, Suspended):');
    if (!newStatus) return;

    alert(`Status change feature will update ${selectedCustomers.length} customer(s) to ${newStatus}`);
    setShowActionsMenu(false);
  };

  const getStatusColor = (status: Customer['status']) => {
    const colors = {
      'Active': 'bg-green-100 text-green-700',
      'Trial': 'bg-blue-100 text-blue-700',
      'Lead': 'bg-yellow-100 text-yellow-700',
      'Canceled': 'bg-red-100 text-red-700',
      'Suspended': 'bg-gray-100 text-gray-700',
      'Refunded': 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Show customer profile if a customer is selected
  if (selectedCustomer) {
    return (
      <CustomerProfilePage
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
        onUpdate={() => {
          fetchCustomers();
          setSelectedCustomer(null);
        }}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Create customer
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <button onClick={() => setShowInfoBanner(!showInfoBanner)} className="w-full flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">ℹ️</span>
            <div className="text-left">
              <div className="font-semibold text-gray-900 mb-1">What are Customers?</div>
              {showInfoBanner && (
                <p className="text-sm text-gray-700">
                  Customers represent individuals referred by affiliates and can be Active/Paid, Leads, or Trial. 
                  Canceled customers have discontinued their plan or product, while Suspended ones have been suspended 
                  by you, preventing further commission generation. <a href="#" className="text-blue-600 hover:underline">Learn more</a>.
                </p>
              )}
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">✕</button>
        </button>
      </div>

      {/* Info Banner for empty state */}
      {customers.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-600">ℹ️</span>
            <span className="text-sm text-gray-700">Looking a little empty? No worries! Add sample data to see what's possible</span>
          </div>
          <button 
            onClick={handleImportSampleData}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            📥 Import sample data
          </button>
          <button className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'customers'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'commissions'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Commissions (0)
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'transactions'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Transactions (0)
          </button>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-gray-200 flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by customer name, email or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              Actions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Manage customers</div>
                  <button 
                    onClick={() => handleExportCustomers('all')} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <span>📤</span> Export all customers
                  </button>
                  <button 
                    onClick={() => handleExportCustomers('selected')} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                    disabled={selectedCustomers.length === 0}
                  >
                    <span>📤</span> Export selected customers
                    {selectedCustomers.length > 0 && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedCustomers.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={handleChangeStatus} 
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                    disabled={selectedCustomers.length === 0}
                  >
                    <span>🔄</span> Change status of selected customers
                    {selectedCustomers.length > 0 && (
                      <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedCustomers.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={handleDeleteSelected} 
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                    disabled={selectedCustomers.length === 0}
                  >
                    <span>🗑️</span> Delete selected customers
                    {selectedCustomers.length > 0 && (
                      <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {selectedCustomers.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customers Table */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h3 className="font-semibold text-gray-900">Customers</h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <div className="text-lg font-medium text-gray-900 mb-2">No data available.</div>
              <div className="text-sm text-gray-600">This table will be populated as soon as there's data.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Customer {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Created at {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('partnerName')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Partner {sortField === 'partnerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('totalPaid')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Total paid {sortField === 'totalPaid' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('totalCommission')}
                      className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-50"
                    >
                      Total commission {sortField === 'totalCommission' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {customer.partnerName}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(customer.status)}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        ₹{(customer.totalPaid / 100).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        ₹{(customer.totalCommission / 100).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 relative">
                        <button
                          onClick={() => setCustomerActionMenuId(customerActionMenuId === customer.id ? null : customer.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {customerActionMenuId === customer.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-2">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setCustomerActionMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <span>🔍</span> Open customer
                              </button>
                              <button
                                onClick={() => {
                                  // Open update modal with this customer
                                  setSelectedCustomer(customer);
                                  setCustomerActionMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <span>🔄</span> Update customer status
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Delete ${customer.name}?`)) {
                                    try {
                                      const response = await fetch(`/api/admin/referrals/${customer.id}`, {
                                        method: 'DELETE'
                                      });
                                      if (response.ok) {
                                        alert('Customer deleted successfully');
                                        fetchCustomers();
                                      }
                                    } catch (error) {
                                      alert('Failed to delete customer');
                                    }
                                  }
                                  setCustomerActionMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <span>🗑️</span> Delete customer
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create customer</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Enter the details below to create a new customer. Ensure all information is accurate for proper tracking and management. 
              <a href="#" className="text-blue-600 hover:underline ml-1">Learn more</a>.
            </p>
            
            <form onSubmit={handleCreateCustomer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partner *
                  </label>
                  <select
                    required
                    value={newCustomer.partnerId}
                    onChange={(e) => setNewCustomer({ ...newCustomer, partnerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select partner</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.user.name} ({partner.referralCode})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newCustomer.date.slice(0, 16)}
                    onChange={(e) => setNewCustomer({ ...newCustomer, date: new Date(e.target.value).toISOString() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name - <span className="text-gray-500 font-normal">optional</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer email/identifier
                  </label>
                  <input
                    type="email"
                    required
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. customer@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription ID - <span className="text-gray-500 font-normal">optional</span>
                  </label>
                  <input
                    type="text"
                    value={newCustomer.subscriptionId}
                    onChange={(e) => setNewCustomer({ ...newCustomer, subscriptionId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. sub_fgUHmeX6w6TFiAsEwqTwTcmN"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="space-y-2">
                    {(['Active', 'Trial', 'Lead', 'Canceled', 'Suspended', 'Refunded'] as const).map((status) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={newCustomer.status === status}
                          onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value as Customer['status'] })}
                          className="mr-2"
                        />
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <label className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Create transaction</div>
                      <div className="text-sm text-gray-500">Create a transaction for this customer</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={newCustomer.createTransaction}
                      onChange={(e) => setNewCustomer({ ...newCustomer, createTransaction: e.target.checked })}
                      className="rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== EMAILS PAGE ====================
interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  sentCount?: number;
  lastSent?: string;
}

// Admin Settings Page Component
function AdminSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'integration'>('profile');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
  });
  const [previewImage, setPreviewImage] = useState<string>(user?.profilePicture || '');
  
  // Integration Form State
  const [integrationForm, setIntegrationForm] = useState({
    provider: 'custom',
    apiKey: '',
    publicKey: '',
    webhookUrl: '',
    trackingScript: '',
    isActive: true,
  });
  const [integrationData, setIntegrationData] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'integration') {
      fetchIntegrationSettings();
    }
  }, [activeTab]);

  const fetchIntegrationSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/integration');
      const data = await response.json();
      if (data.success && data.integration) {
        setIntegrationData(data.integration);
        setIntegrationForm({
          provider: data.integration.provider || 'tolt',
          apiKey: data.integration.apiKey || '',
          publicKey: data.integration.publicKey || '',
          webhookUrl: data.integration.webhookUrl || '',
          trackingScript: data.integration.trackingScript || '',
          isActive: data.integration.isActive ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch integration settings:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setNotification({ type: 'error', message: 'Image size must be less than 2MB' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setProfileForm({ ...profileForm, profilePicture: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const response = await fetch('/api/admin/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();
      
      if (data.success) {
        setNotification({ type: 'success', message: 'Profile updated successfully!' });
        // Reload page to update user data in context
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'An error occurred while updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const response = await fetch('/api/admin/settings/integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integrationForm),
      });

      const data = await response.json();
      
      if (data.success) {
        setNotification({ type: 'success', message: 'Integration settings saved successfully!' });
        fetchIntegrationSettings();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to save integration settings' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'An error occurred while saving integration settings' });
    } finally {
      setLoading(false);
    }
  };

  const generateTrackingScript = () => {
    if (!integrationForm.publicKey && !integrationForm.apiKey) {
      return '';
    }

    const apiKey = integrationForm.apiKey || '';
    const publicKey = integrationForm.publicKey || '';
    const provider = integrationForm.provider || 'custom';
    
    // Generic tracking script template
    return `<script>
  // Affiliate Tracking Script
  (function() {
    var affiliateScript = document.createElement('script');
    affiliateScript.src = 'https://yourcdn.com/affiliate-tracking.js';
    affiliateScript.setAttribute('data-api-key', '${publicKey || apiKey}');
    affiliateScript.setAttribute('data-provider', '${provider}');
    affiliateScript.async = true;
    
    affiliateScript.onload = function() {
      if (window.AffiliateTracker) {
        window.AffiliateTracker.init({
          apiKey: '${apiKey}',
          publicKey: '${publicKey}',
          provider: '${provider}',
          trackClicks: true,
          trackConversions: true
        });
      }
    };
    
    document.head.appendChild(affiliateScript);
  })();
</script>`;
  };

  useEffect(() => {
    if (integrationForm.publicKey || integrationForm.apiKey) {
      setIntegrationForm({
        ...integrationForm,
        trackingScript: generateTrackingScript(),
      });
    }
  }, [integrationForm.publicKey, integrationForm.apiKey]);

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✓' : '⚠'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile and integration settings</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              👤 Profile
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'integration'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🔌 Integration
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-8">
            <form onSubmit={handleProfileUpdate} className="max-w-2xl space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold border-2 border-gray-200">
                        {profileForm.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-picture-input"
                    />
                    <label
                      htmlFor="profile-picture-input"
                      className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Upload new picture
                    </label>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage('');
                          setProfileForm({ ...profileForm, profilePicture: '' });
                        }}
                        className="text-sm text-red-600 hover:text-red-700 mt-2"
                      >
                        Remove picture
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This email will be used for all notifications</p>
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Integration Tab */}
        {activeTab === 'integration' && (
          <div className="p-8">
            <form onSubmit={handleIntegrationSave} className="max-w-3xl space-y-6">
              {/* Integration Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-xl">ℹ️</div>
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">Integration Setup</h3>
                    <p className="text-sm text-blue-800">
                      Configure your affiliate tracking integration settings. The tracking script below is a template 
                      that can be customized for your tracking system to automatically capture referrals and conversions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Integration Provider</label>
                <select
                  value={integrationForm.provider}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, provider: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="custom">Custom Integration</option>
                  <option value="tolt">Tolt.io</option>
                  <option value="rewardful">Rewardful</option>
                  <option value="tapfiliate">Tapfiliate</option>
                  <option value="partnerstack">PartnerStack</option>
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key (Private)
                </label>
                <input
                  type="text"
                  value={integrationForm.apiKey}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, apiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter your private API key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your private API key for server-side operations and backend integration
                </p>
              </div>

              {/* Public Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Key (Client-side)
                </label>
                <input
                  type="text"
                  value={integrationForm.publicKey}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, publicKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter your public key"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your public key used in the client-side tracking script
                </p>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL (Optional)</label>
                <input
                  type="url"
                  value={integrationForm.webhookUrl}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, webhookUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://yoursite.com/api/webhooks/affiliate"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Endpoint to receive webhook notifications from {integrationForm.provider}
                </p>
              </div>

              {/* Tracking Script Preview */}
              {(integrationForm.publicKey || integrationForm.apiKey) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Script Template
                  </label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-yellow-800">
                      ⚠️ <strong>Note:</strong> This is a generic template. Replace <code className="bg-yellow-100 px-1 rounded">yourcdn.com/affiliate-tracking.js</code> with your actual tracking script URL and customize the initialization for your specific tracking system.
                    </p>
                  </div>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                      {generateTrackingScript()}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generateTrackingScript());
                        setNotification({ type: 'success', message: 'Script template copied to clipboard!' });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="absolute top-3 right-3 px-3 py-1 bg-white text-gray-700 rounded text-xs font-medium hover:bg-gray-100"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Customize this template and add it to the <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> section of your website
                  </p>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="integration-active"
                  checked={integrationForm.isActive}
                  onChange={(e) => setIntegrationForm({ ...integrationForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="integration-active" className="text-sm font-medium text-gray-700">
                  Enable integration tracking
                </label>
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save integration settings'}
                </button>
                {integrationData && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Last updated: {new Date(integrationData.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function EmailsPage() {
  const [activeTab, setActiveTab] = useState<'notification' | 'campaign'>('notification');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customizeForm, setCustomizeForm] = useState({
    subject: '',
    body: '',
    variables: [] as string[],
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/emails');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const notificationTemplates: EmailTemplate[] = [
    {
      id: '1',
      type: 'WELCOME_EMAIL',
      name: 'Welcome email',
      subject: 'Welcome to {{program_name}}',
      body: 'Sends a welcome email when a partner signs up.',
      variables: ['partner_name', 'program_name', 'referral_link'],
      isActive: true,
      sentCount: 24,
      lastSent: '2 hours ago',
    },
    {
      id: '2',
      type: 'FIRST_REFERRAL',
      name: 'Partner gets their first referral',
      subject: '🎉 You got your first referral!',
      body: 'Send an email when a partner receives their first referral.',
      variables: ['partner_name', 'referral_name', 'referral_email'],
      isActive: true,
      sentCount: 12,
      lastSent: '1 day ago',
    },
    {
      id: '3',
      type: 'NEW_REFERRAL',
      name: 'Partner gets a new referral',
      subject: 'New referral from {{referral_name}}',
      body: 'Sends an email for every new referral a partner receives.',
      variables: ['partner_name', 'referral_name', 'referral_count'],
      isActive: true,
      sentCount: 156,
      lastSent: '3 hours ago',
    },
    {
      id: '4',
      type: 'PARTNER_PAID',
      name: 'Partner gets paid',
      subject: '💰 Your payout is on the way!',
      body: 'Sends an email when a partner is paid.',
      variables: ['partner_name', 'amount', 'payout_method'],
      isActive: true,
      sentCount: 8,
      lastSent: '5 days ago',
    },
    {
      id: '5',
      type: 'PARTNER_INVITATION',
      name: 'Partner invitation email',
      subject: 'You\'re invited to join {{program_name}}',
      body: 'Sends an email when a partner is invited to your program.',
      variables: ['partner_email', 'program_name', 'signup_link'],
      isActive: true,
      sentCount: 45,
      lastSent: '6 hours ago',
    },
    {
      id: '6',
      type: 'PARTNER_APPROVAL',
      name: 'Partner approval email',
      subject: '✅ Your application has been approved!',
      body: 'Sends an email when a partner is approved for your program.',
      variables: ['partner_name', 'program_name', 'dashboard_link'],
      isActive: true,
      sentCount: 18,
      lastSent: '2 days ago',
    },
    {
      id: '7',
      type: 'PARTNER_DECLINED',
      name: 'Partner declined email',
      subject: 'Update on your application',
      body: 'Sends an email when a partner is declined from your program.',
      variables: ['partner_name', 'program_name', 'reason'],
      isActive: false,
      sentCount: 3,
      lastSent: '1 week ago',
    },
  ];

  const handleCustomize = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCustomizeForm({
      subject: template.subject,
      body: template.body,
      variables: template.variables,
    });
    setShowCustomizeModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate?.id,
          type: selectedTemplate?.type,
          name: selectedTemplate?.name,
          subject: customizeForm.subject,
          body: customizeForm.body,
          variables: customizeForm.variables,
        }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Email template updated successfully!' });
        setShowCustomizeModal(false);
        loadTemplates();
        setTimeout(() => setNotification(null), 3000);
      } else {
        throw new Error('Failed to update template');
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update email template' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSendTest = async (templateId: string) => {
    try {
      const response = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Test email sent successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to send test email' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading email templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Emails</h1>
        <p className="text-gray-600 mt-1">Manage notification emails and campaigns sent to your partners</p>
      </div>

      {/* Sample Data Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 mt-0.5">ℹ️</div>
          <div>
            <div className="font-medium text-gray-900">Heads up! You're seeing some sample data. Want to clean things up?</div>
            <div className="text-sm text-gray-600 mt-1">Sample data tag visible throughout the interface</div>
          </div>
        </div>
        <button className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2">
          <span>🗑️</span>
          Delete sample data
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('notification')}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'notification'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Notification emails
          </button>
          <button
            onClick={() => setActiveTab('campaign')}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'campaign'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Email campaigns
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">BETA</span>
          </button>
        </div>
      </div>

      {/* Notification Section */}
      {notification && (
        <div className={`p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {notification.message}
        </div>
      )}

      {activeTab === 'notification' && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700">Notification emails sent to your partners</div>
          
          {notificationTemplates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {!template.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Disabled</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.body}</p>
                  
                  {template.sentCount !== undefined && (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📧 Sent {template.sentCount} times</span>
                      <span>•</span>
                      <span>Last sent {template.lastSent}</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleCustomize(template)}
                  className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Customize email
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'campaign' && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Campaigns Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              Create and send custom email campaigns to your partners. This feature is currently in beta and will be available soon.
            </p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Request Early Access
            </button>
          </div>
        </div>
      )}

      {/* Customize Modal */}
      {showCustomizeModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Customize {selectedTemplate.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">Edit the email template sent to your partners</p>
                </div>
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-6 space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                <input
                  type="text"
                  value={customizeForm.subject}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                <textarea
                  value={customizeForm.body}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, body: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter email body content"
                />
                <p className="text-xs text-gray-500 mt-2">Use HTML for formatting or plain text for simple emails</p>
              </div>

              {/* Available Variables */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-2">Available Variables</div>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const cursorPos = textarea.selectionStart;
                          const textBefore = customizeForm.body.substring(0, cursorPos);
                          const textAfter = customizeForm.body.substring(cursorPos);
                          setCustomizeForm({
                            ...customizeForm,
                            body: textBefore + `{{${variable}}}` + textAfter,
                          });
                        }
                      }}
                      className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 text-sm font-mono"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">Click to insert variable at cursor position</p>
              </div>

              {/* Preview Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-3">Preview</div>
                <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Subject:</span>
                    <span className="ml-2 text-gray-900">{customizeForm.subject || 'No subject'}</span>
                  </div>
                  <div className="text-sm border-t pt-2">
                    <div className="text-gray-700 whitespace-pre-wrap">{customizeForm.body || 'No content'}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleSendTest(selectedTemplate.id)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Send test email
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomizeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [activePage, setActivePage] = useState('home');

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch('/api/admin/dashboard');
      const statsData = await statsRes.json();
      
      const analyticsRes = await fetch('/api/admin/analytics?days=30');
      const analyticsData = await analyticsRes.json();
      
      const referralsRes = await fetch('/api/admin/referrals');
      const referralsData = await referralsRes.json();

      if (statsData.success) {
        setStats({
          totalRevenue: statsData.stats.totalRevenue || 0,
          totalClicks: 0,
          totalLeads: statsData.stats.totalReferrals || 0,
          totalReferredCustomers: statsData.stats.approvedReferrals || 0,
          totalAffiliates: statsData.stats.totalAffiliates || 0,
          pendingReferrals: statsData.stats.pendingReferrals || 0
        });
      }

      if (analyticsData.success && analyticsData.analytics.topAffiliates) {
        setTopAffiliates(analyticsData.analytics.topAffiliates.slice(0, 5));
      }

      if (referralsData.success) {
        const recent = referralsData.referrals.slice(0, 10).map((ref: any) => ({
          id: ref.id,
          leadName: ref.leadName,
          leadEmail: ref.leadEmail,
          affiliateName: ref.affiliate.name,
          amountPaid: 0,
          status: ref.status,
          createdAt: ref.createdAt
        }));
        setRecentCustomers(recent);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin role required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">🎯 Affiliate Admin</h1>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">🚀 Getting started</span>
            <button className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2">
          <button
            onClick={() => setActivePage('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activePage === 'home' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>
          
          <button
            onClick={() => setActivePage('partners')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activePage === 'partners' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>👥</span>
            <span>Partners</span>
          </button>
          
          <button
            onClick={() => setActivePage('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activePage === 'customers' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>👤</span>
            <span>Customers</span>
          </button>
          
          <button
            onClick={() => setActivePage('payouts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activePage === 'payouts' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>💳</span>
            <span>Payouts</span>
          </button>

          <button
            onClick={() => setActivePage('emails')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activePage === 'emails' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>📧</span>
            <span>Emails</span>
          </button>

          <div className="my-4 border-t border-gray-200"></div>
          
          <div className="text-xs font-semibold text-gray-500 px-4 py-2">Configure</div>
          
          <button
            onClick={() => setActivePage('program-settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activePage === 'program-settings' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>⚙️</span>
            <span>Program settings</span>
          </button>
          
          <button
            onClick={() => setActivePage('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activePage === 'settings' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>🔧</span>
            <span>Settings</span>
          </button>
          
          <button
            onClick={() => setActivePage('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${
              activePage === 'reports' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>📊</span>
            <span className="flex items-center gap-2">
              Reports
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">BETA</span>
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
            <button onClick={() => logout()} className="text-gray-400 hover:text-gray-600" title="Logout">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Good morning, {user.name}! 👋</h1>
            <p className="text-gray-600">Welcome to your affiliate admin dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {activePage === 'home' && (
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Affiliate Program Dashboard</h2>
              </div>

              <div className="grid grid-cols-4 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Total revenue generated</div>
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{stats ? (stats.totalRevenue / 100).toFixed(2) : '0.00'}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setActivePage('partners')} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                      View partners
                    </button>
                    <button onClick={() => setActivePage('customers')} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                      View customers
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-gray-600">Total clicks</div>
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                      <span>🔗</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.totalClicks || 0}</div>
                  <div className="text-xs text-gray-500 mt-2">All clicks from partner links</div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-gray-600">Total leads</div>
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                      <span>👥</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.totalLeads || 0}</div>
                  <div className="text-xs text-gray-500 mt-2">All sign ups from partner links</div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-sm text-gray-600">Total referred customers</div>
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                      <span>🎯</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats?.totalReferredCustomers || 0}</div>
                  <div className="text-xs text-gray-500 mt-2">All paid referred customers</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Top partners by revenue brought in</h3>
                  <button onClick={() => setActivePage('partners')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all →
                  </button>
                </div>
                
                {topAffiliates.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-500 uppercase pb-2 border-b">
                      <div>Partner</div>
                      <div className="text-right">Total revenue</div>
                    </div>
                    {topAffiliates.map((affiliate) => (
                      <div key={affiliate.id} className="grid grid-cols-2 gap-4 items-center py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <div className="font-medium text-gray-900">{affiliate.name}</div>
                          <div className="text-sm text-gray-500">{affiliate.referralCode}</div>
                        </div>
                        <div className="text-right font-bold text-gray-900">
                          ₹{(affiliate.totalRevenue / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-gray-500">No partners data yet</div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Recent referred customers</h3>
                  <button onClick={() => setActivePage('customers')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all →
                  </button>
                </div>
                
                {recentCustomers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase pb-2 border-b">
                      <div>Referred at</div>
                      <div>Email</div>
                      <div>Partner</div>
                      <div className="text-right">Status</div>
                    </div>
                    {recentCustomers.map((customer) => (
                      <div key={customer.id} className="grid grid-cols-4 gap-4 items-center py-3 border-b border-gray-100 last:border-0 text-sm">
                        <div className="text-gray-600">
                          {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-gray-900 truncate">{customer.leadEmail}</div>
                        <div className="text-gray-600 truncate">{customer.affiliateName}</div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            customer.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            customer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {customer.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <div className="text-gray-500">No customers yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activePage === 'partners' && <PartnersPage />}
        
        {activePage === 'customers' && <CustomersPage />}
        
        {activePage === 'payouts' && <PayoutsPage />}
        
        {activePage === 'emails' && <EmailsPage />}
        
        {activePage === 'program-settings' && <ProgramSettingsPage />}
        
        {activePage === 'settings' && <AdminSettingsPage />}

        {activePage !== 'home' && activePage !== 'partners' && activePage !== 'customers' && activePage !== 'payouts' && activePage !== 'emails' && activePage !== 'program-settings' && activePage !== 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </h2>
            <p className="text-gray-600">This section is under development</p>
          </div>
        )}
      </div>
    </div>
  );
}
