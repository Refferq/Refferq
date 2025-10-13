'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AffiliateStats {
  totalEarnings: number;
  totalClicks: number;
  totalLeads: number;
  totalReferredCustomers: number;
  referralLink: string;
  referralCode: string;
}

interface Referral {
  id: string;
  leadName: string;
  leadEmail: string;
  company?: string;
  estimatedValue: number;
  status: string;
  createdAt: string;
  amountPaid?: number;
  commission?: number;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  paidAt?: string;
}

// Dashboard Page Component
function DashboardPage({ stats, referrals }: { stats: AffiliateStats | null; referrals: Referral[] }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Earnings</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ₹{((stats?.totalEarnings || 0) / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Clicks</span>
            <span className="text-2xl">👆</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalClicks || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Link clicks</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Leads</span>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalLeads || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Submitted leads</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Customers</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalReferredCustomers || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Converted customers</p>
        </div>
      </div>

      {/* Links Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Links</h3>
        
        {!stats?.referralCode ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔗</div>
            <p className="text-gray-600 mb-4">No referral code found</p>
            <p className="text-sm text-gray-500 mb-4">
              Generate your referral code to start earning commissions
            </p>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/affiliate/generate-code', { method: 'POST' });
                  const data = await response.json();
                  if (data.success) {
                    window.location.reload();
                  } else {
                    alert('Failed to generate code: ' + data.error);
                  }
                } catch (error) {
                  console.error('Failed to generate code:', error);
                  alert('Failed to generate code. Please try again.');
                }
              }}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
            >
              Generate Referral Code
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={stats?.referralLink || ''}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(stats?.referralLink || '')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Referral Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={stats?.referralCode || ''}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(stats?.referralCode || '')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Referrals */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No referrals yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 5).map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{ref.leadName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{ref.leadEmail}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ref.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        ref.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      ₹{(Number(ref.estimatedValue) || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Referrals Page Component
function ReferralsPage({ referrals, onSubmitLead }: { referrals: Referral[]; onSubmitLead: () => void }) {
  const [activeTab, setActiveTab] = useState<'all' | 'submitted'>('all');

  const filteredReferrals = activeTab === 'submitted' 
    ? referrals.filter(r => r.status === 'PENDING')
    : referrals;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Referrals</h2>
        <button
          onClick={onSubmitLead}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium flex items-center gap-2"
        >
          <span>+</span>
          <span>Submit lead</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Referrals ({referrals.length})
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submitted'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Submitted Leads ({referrals.filter(r => r.status === 'PENDING').length})
          </button>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredReferrals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-600 mb-4">No referrals yet</p>
            <button
              onClick={onSubmitLead}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
            >
              Submit your first lead
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Lead Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Est. Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{ref.leadName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{ref.leadEmail}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{ref.company || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ref.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        ref.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">
                      ₹{(Number(ref.estimatedValue) || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Payouts Page Component
function PayoutsPage({ stats, payouts }: { stats: AffiliateStats | null; payouts: Payout[] }) {
  const totalPaid = payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Payouts</h2>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Earned</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{((stats?.totalEarnings || 0) / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{(totalPaid / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            ₹{(pendingAmount / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Next Payout</p>
          <p className="text-lg font-bold text-gray-900">Jan 1, 2026</p>
          <p className="text-xs text-gray-500 mt-1">Monthly cycle</p>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout History</h3>
        {payouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No payouts yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {new Date(payout.paidAt || payout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{payout.method}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payout.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        payout.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      ₹{(payout.amount / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Settings Page Component
function SettingsPage({ 
  settingsForm, 
  setSettingsForm, 
  onUpdate 
}: { 
  settingsForm: any; 
  setSettingsForm: (form: any) => void;
  onUpdate: (field: string) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      {/* Personal Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
          <button
            onClick={() => onUpdate('Personal Details')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            Update
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={settingsForm.name}
              onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <input
              type="text"
              value={settingsForm.company}
              onChange={(e) => setSettingsForm({ ...settingsForm, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Company Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={settingsForm.email}
              onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <select
              value={settingsForm.country}
              onChange={(e) => setSettingsForm({ ...settingsForm, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="India">India</option>
              <option value="USA">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          <button
            onClick={() => onUpdate('Payment Details')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            Update
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={settingsForm.paymentMethod}
              onChange={(e) => setSettingsForm({ ...settingsForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PayPal">PayPal</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Stripe">Stripe</option>
              <option value="Wire Transfer">Wire Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Email / Account</label>
            <input
              type="text"
              value={settingsForm.paymentEmail}
              onChange={(e) => setSettingsForm({ ...settingsForm, paymentEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="payment@example.com"
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Payouts are processed on the 1st of each month for the previous month's earnings. 
            Minimum payout threshold is ₹1,000.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AffiliateDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Referral form state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    leadName: '',
    leadEmail: '',
    estimatedValue: '0',
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    company: '',
    email: '',
    country: '',
    paymentMethod: 'PayPal',
    paymentEmail: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData();
    }
  }, [authLoading, user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/affiliate/profile');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalEarnings: data.affiliate?.balanceCents || 0,
          totalClicks: 0,
          totalLeads: data.referrals?.length || 0,
          totalReferredCustomers: data.referrals?.filter((r: any) => r.status === 'APPROVED').length || 0,
          referralLink: `${window.location.origin}/r/${data.affiliate?.referralCode}`,
          referralCode: data.affiliate?.referralCode || '',
        });
        setReferrals(data.referrals || []);
        
        // Load user settings
        setSettingsForm({
          name: user?.name || '',
          company: '',
          email: user?.email || '',
          country: 'India',
          paymentMethod: 'PayPal',
          paymentEmail: user?.email || '',
        });
      }
      
      // Load payouts
      const payoutsRes = await fetch('/api/affiliate/payouts');
      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json();
        setPayouts(payoutsData.payouts || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/affiliate/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_name: submitForm.leadName,
          lead_email: submitForm.leadEmail,
          estimated_value: submitForm.estimatedValue,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNotification({ type: 'success', message: 'Lead submitted successfully! Waiting for admin approval.' });
        setShowSubmitModal(false);
        setSubmitForm({ leadName: '', leadEmail: '', estimatedValue: '0' });
        loadDashboardData();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to submit lead' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'An error occurred while submitting lead' });
    }

    setTimeout(() => setNotification(null), 5000);
  };

  const handleUpdateSettings = async (field: string) => {
    try {
      const response = await fetch('/api/affiliate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: `${field} updated successfully!` });
      } else {
        setNotification({ type: 'error', message: `Failed to update ${field}` });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'An error occurred' });
    }

    setTimeout(() => setNotification(null), 5000);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.hasAffiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">Affiliate account required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✓' : '⚠'}</span>
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Affiliate Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome, {user.name}</p>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => setActivePage('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-left ${
              activePage === 'dashboard' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>🏠</span>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActivePage('referrals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-left ${
              activePage === 'referrals' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>👥</span>
            <span>Referrals</span>
          </button>
          
          <button
            onClick={() => setActivePage('resources')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-left ${
              activePage === 'resources' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>📚</span>
            <span>Resources</span>
          </button>
          
          <button
            onClick={() => setActivePage('payouts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-left ${
              activePage === 'payouts' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>💳</span>
            <span>Payouts</span>
          </button>
          
          <button
            onClick={() => setActivePage('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-left ${
              activePage === 'reports' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              📊
              <span>Reports</span>
              <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Beta</span>
            </span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setActivePage('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-left ${
              activePage === 'settings' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-60 p-8">
        {/* Top Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-green-800">
            <span>✓</span>
            <span className="text-sm font-medium">Earn 20% on all paid customers.</span>
          </div>
        </div>

        {/* Dashboard Page */}
        {activePage === 'dashboard' && (
          <DashboardPage stats={stats} referrals={referrals} />
        )}

        {/* Referrals Page */}
        {activePage === 'referrals' && (
          <ReferralsPage 
            referrals={referrals} 
            onSubmitLead={() => setShowSubmitModal(true)} 
          />
        )}

        {/* Payouts Page */}
        {activePage === 'payouts' && (
          <PayoutsPage stats={stats} payouts={payouts} />
        )}

        {/* Settings Page */}
        {activePage === 'settings' && (
          <SettingsPage 
            settingsForm={settingsForm} 
            setSettingsForm={setSettingsForm}
            onUpdate={handleUpdateSettings}
          />
        )}

        {/* Other Pages */}
        {(activePage === 'resources' || activePage === 'reports') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </h2>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        )}
      </div>

      {/* Submit Lead Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Submit lead</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Enter the details below to submit a lead. Ensure all information is accurate for proper tracking and follow-up.
            </p>

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  What's the lead's name?*
                </label>
                <input
                  type="text"
                  required
                  value={submitForm.leadName}
                  onChange={(e) => setSubmitForm({ ...submitForm, leadName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  What is the main contact's email address?*
                </label>
                <input
                  type="email"
                  required
                  value={submitForm.leadEmail}
                  onChange={(e) => setSubmitForm({ ...submitForm, leadEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  What is the estimated deal size for this lead? (Type 0 if unsure)*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    required
                    value={submitForm.estimatedValue}
                    onChange={(e) => setSubmitForm({ ...submitForm, estimatedValue: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Submit lead
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}