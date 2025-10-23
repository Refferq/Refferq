'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Partner {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  partnerGroup?: string;
  commissionRate: number;
  status: string;
  totalClicks: number;
  totalLeads: number;
  totalRevenue: number;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  status: string;
  totalPaid: number;
  createdAt: string;
}

interface Commission {
  id: string;
  transactionId: string;
  customerName: string;
  amountCents: number;
  rate: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'REFUNDED';
  createdAt: string;
  paidAt?: string;
}

interface Payout {
  id: string;
  amountCents: number;
  commissionCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  method?: string;
  createdAt: string;
  processedAt?: string;
}

type TabType = 'overview' | 'customers' | 'commissions' | 'payouts';

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const partnerId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingPayout, setEditingPayout] = useState<Payout | null>(null);
  const [newStatus, setNewStatus] = useState<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('PENDING');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }

    if (user && partnerId) {
      fetchPartnerData();
      fetchCustomers();
      fetchCommissions();
      fetchPayouts();
    }
  }, [authLoading, user, partnerId]);

  const fetchPartnerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/affiliates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const affiliate = data.affiliates?.find((a: any) => a.id === partnerId);
        
        if (affiliate) {
          setPartner({
            id: affiliate.id,
            name: affiliate.name,
            email: affiliate.email,
            referralCode: affiliate.referralCode,
            partnerGroup: affiliate.partnerGroup,
            commissionRate: affiliate.commissionRate || 0.20,
            status: affiliate.status,
            totalClicks: affiliate.totalClicks || 0,
            totalLeads: affiliate.totalLeads || 0,
            totalRevenue: affiliate.totalRevenue || 0,
            createdAt: affiliate.createdAt,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching partner:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const partnerCustomers = data.referrals
          ?.filter((r: any) => r.affiliateId === partnerId)
          .map((r: any) => ({
            id: r.id,
            name: r.leadName,
            email: r.leadEmail,
            status: r.status,
            totalPaid: r.estimatedValue || 0,
            createdAt: r.createdAt,
          })) || [];
        setCustomers(partnerCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCommissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/transactions?affiliateId=${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const comms = data.transactions?.map((txn: any) => ({
          id: txn.id,
          transactionId: txn.id,
          customerName: txn.customerName,
          amountCents: txn.commissionCents,
          rate: txn.commissionRate,
          status: txn.status === 'COMPLETED' ? 'PENDING' : txn.status,
          createdAt: txn.createdAt,
          paidAt: txn.paidAt,
        })) || [];
        setCommissions(comms);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/payouts?affiliateId=${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const handleCreatePayout = async () => {
    if (selectedCommissions.length === 0) {
      alert('Please select at least one commission to create a payout');
      return;
    }

    setPayoutLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          affiliateId: partnerId,
          commissionIds: selectedCommissions,
        }),
      });

      if (res.ok) {
        alert('Payout created successfully!');
        setShowPayoutModal(false);
        setSelectedCommissions([]);
        fetchCommissions();
        fetchPayouts();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to create payout'}`);
      }
    } catch (error) {
      console.error('Error creating payout:', error);
      alert('Failed to create payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleUpdatePayoutStatus = async () => {
    if (!editingPayout) return;

    setPayoutLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/payouts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingPayout.id,
          status: newStatus,
        }),
      });

      if (res.ok) {
        alert('Payout status updated successfully!');
        setShowStatusModal(false);
        setEditingPayout(null);
        fetchPayouts();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to update payout status'}`);
      }
    } catch (error) {
      console.error('Error updating payout status:', error);
      alert('Failed to update payout status');
    } finally {
      setPayoutLoading(false);
    }
  };

  const openStatusModal = (payout: Payout) => {
    setEditingPayout(payout);
    setNewStatus(payout.status);
    setShowStatusModal(true);
  };

  const toggleCommissionSelection = (commissionId: string) => {
    setSelectedCommissions((prev) =>
      prev.includes(commissionId)
        ? prev.filter((id) => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const formatCurrency = (cents: number) => {
    return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const pendingCommissions = commissions.filter((c) => c.status === 'PENDING');
  const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amountCents, 0);
  const paidCommissions = commissions.filter((c) => c.status === 'PAID');
  const paidAmount = paidCommissions.reduce((sum, c) => sum + c.amountCents, 0);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading partner details...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Partner not found</h2>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Dashboard
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{partner.name}</h1>
            <p className="text-gray-600 mt-1">{partner.email}</p>
            <div className="flex gap-4 mt-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {partner.referralCode}
              </span>
              {partner.partnerGroup && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {partner.partnerGroup}
                </span>
              )}
              <span className="text-sm text-gray-500">
                Commission: {(partner.commissionRate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={pendingCommissions.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            + Create Payout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Customers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Pending Commissions</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {formatCurrency(pendingAmount)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Paid Out</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(paidAmount)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Payouts</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{payouts.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'customers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Customers ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'commissions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Commissions ({commissions.length})
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'payouts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Payouts ({payouts.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Partner Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Partner Name</div>
                    <div className="font-medium">{partner.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium">{partner.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Referral Code</div>
                    <div className="font-medium font-mono">{partner.referralCode}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Partner Group</div>
                    <div className="font-medium">{partner.partnerGroup || 'Default'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Commission Rate</div>
                    <div className="font-medium">{(partner.commissionRate * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Partner Since</div>
                    <div className="font-medium">{formatDate(partner.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Clicks</div>
                    <div className="text-2xl font-bold">{partner.totalClicks}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Leads</div>
                    <div className="text-2xl font-bold">{partner.totalLeads}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(partner.totalRevenue * 100)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Commission Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Commissions</div>
                    <div className="text-2xl font-bold">{commissions.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Pending Amount</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(pendingAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Paid Amount</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(paidAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Referred Customers</h3>
              {customers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No customers yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {customer.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {customer.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(customer.status)}`}>
                              {customer.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(customer.totalPaid * 100)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(customer.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => router.push(`/admin/customers/${customer.id}`)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Commission History</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Pending: {formatCurrency(pendingAmount)} | Paid: {formatCurrency(paidAmount)}
                  </div>
                  {pendingCommissions.length > 0 && (
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Create Payout
                    </button>
                  )}
                </div>
              </div>
              {commissions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No commissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commissions.map((comm) => (
                        <tr key={comm.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(comm.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {comm.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {formatCurrency(comm.amountCents)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(comm.rate * 100).toFixed(0)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(comm.status)}`}>
                              {comm.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Payout History</h3>
              {payouts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No payouts yet</p>
                  {pendingCommissions.length > 0 && (
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Create First Payout
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commissions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payout.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(payout.amountCents)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payout.commissionCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payout.status)}`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.method || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.processedAt ? formatDate(payout.processedAt) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => openStatusModal(payout)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create Payout</h2>
                <button
                  onClick={() => {
                    setShowPayoutModal(false);
                    setSelectedCommissions([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  Select commissions to include in this payout
                </div>
                <div className="text-lg font-bold text-blue-600 mt-1">
                  Total: {formatCurrency(
                    selectedCommissions.reduce((sum, id) => {
                      const comm = pendingCommissions.find((c) => c.id === id);
                      return sum + (comm?.amountCents || 0);
                    }, 0)
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingCommissions.map((comm) => (
                  <div
                    key={comm.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCommissions.includes(comm.id)}
                      onChange={() => toggleCommissionSelection(comm.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-grow">
                      <div className="font-medium">{comm.customerName}</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(comm.createdAt)} • {(comm.rate * 100).toFixed(0)}% commission
                      </div>
                    </div>
                    <div className="font-bold text-blue-600">
                      {formatCurrency(comm.amountCents)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayoutModal(false);
                    setSelectedCommissions([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePayout}
                  disabled={payoutLoading || selectedCommissions.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {payoutLoading ? 'Creating...' : `Create Payout (${selectedCommissions.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Payout Status Modal */}
      {showStatusModal && editingPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Update Payout Status</h2>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setEditingPayout(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Payout Amount</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(editingPayout.amountCents)}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {editingPayout.commissionCount} commissions • Created {formatDate(editingPayout.createdAt)}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDING">PENDING - Awaiting processing</option>
                  <option value="PROCESSING">PROCESSING - Payment in progress</option>
                  <option value="COMPLETED">COMPLETED - Payment successful</option>
                  <option value="FAILED">FAILED - Payment failed</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {newStatus === 'COMPLETED' && 'Affiliate will be notified of payment completion'}
                  {newStatus === 'PROCESSING' && 'Payout is being processed'}
                  {newStatus === 'FAILED' && 'Payment failed, may need manual intervention'}
                  {newStatus === 'PENDING' && 'Payout is waiting to be processed'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setEditingPayout(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePayoutStatus}
                  disabled={payoutLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {payoutLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
