'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

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

interface Transaction {
  id: string;
  customerName: string;
  customerEmail: string;
  amountCents: number;
  commissionCents: number;
  commissionRate: number;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED';
  description?: string;
  invoiceId?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  affiliate: {
    id: string;
    name: string;
    email: string;
    partnerGroup?: string;
  };
}

interface Commission {
  id: string;
  amountCents: number;
  rate: number;
  status: string;
  createdAt: string;
}

type TabType = 'overview' | 'transactions' | 'commissions' | 'activity';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const customerId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  // Form state for creating transaction
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    invoiceId: '',
    paymentMethod: 'Credit Card',
    paidAt: new Date().toISOString().split('T')[0],
  });

  // Form state for editing transaction
  const [editFormData, setEditFormData] = useState({
    amount: '',
    description: '',
    invoiceId: '',
    paymentMethod: 'Credit Card',
    status: 'COMPLETED',
    paidAt: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }

    if (user && customerId) {
      fetchCustomerData();
      fetchTransactions();
    }
  }, [authLoading, user, customerId]);

  const fetchCustomerData = async () => {
    try {
      // Find customer from referrals
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const referral = data.referrals?.find((r: any) => r.id === customerId);
        
        if (referral) {
          setCustomer({
            id: referral.id,
            name: referral.leadName,
            email: referral.leadEmail,
            partnerId: referral.affiliateId,
            partnerName: referral.affiliateName,
            status: referral.status,
            subscriptionId: referral.subscriptionId,
            totalPaid: referral.estimatedValue || 0,
            totalCommission: referral.estimatedCommission || 0,
            createdAt: referral.createdAt,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/transactions?referralId=${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        
        // Extract commissions from transactions
        const comms = data.transactions?.map((txn: Transaction) => ({
          id: txn.id,
          amountCents: txn.commissionCents,
          rate: txn.commissionRate,
          status: txn.status,
          createdAt: txn.createdAt,
        })) || [];
        setCommissions(comms);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referralId: customerId,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined,
          invoiceId: formData.invoiceId || undefined,
          paymentMethod: formData.paymentMethod,
          paidAt: formData.paidAt ? new Date(formData.paidAt).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        alert('Transaction created successfully!');
        setShowCreateModal(false);
        setFormData({
          amount: '',
          description: '',
          invoiceId: '',
          paymentMethod: 'Credit Card',
          paidAt: new Date().toISOString().split('T')[0],
        });
        fetchTransactions();
        fetchCustomerData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to create transaction'}`);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setCreateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingTransaction.id,
          status: editFormData.status,
          description: editFormData.description || undefined,
          invoiceId: editFormData.invoiceId || undefined,
          paymentMethod: editFormData.paymentMethod,
          paidAt: editFormData.paidAt ? new Date(editFormData.paidAt).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        alert('Transaction updated successfully!');
        setShowEditModal(false);
        setEditingTransaction(null);
        fetchTransactions();
        fetchCustomerData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to update transaction'}`);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransactionId) return;

    setCreateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/transactions?id=${deletingTransactionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Transaction deleted successfully!');
        setShowDeleteConfirm(false);
        setDeletingTransactionId(null);
        fetchTransactions();
        fetchCustomerData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to delete transaction'}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction');
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      amount: (transaction.amountCents / 100).toString(),
      description: transaction.description || '',
      invoiceId: transaction.invoiceId || '',
      paymentMethod: transaction.paymentMethod || 'Credit Card',
      status: transaction.status,
      paidAt: transaction.paidAt ? new Date(transaction.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (transactionId: string) => {
    setDeletingTransactionId(transactionId);
    setShowDeleteConfirm(true);
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
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'Trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
      case 'Refunded':
        return 'bg-red-100 text-red-800';
      case 'FAILED':
      case 'Canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Customer not found</h2>
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
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600 mt-1">{customer.email}</p>
            <div className="flex gap-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
                {customer.status}
              </span>
              {customer.subscriptionId && (
                <span className="text-sm text-gray-500">ID: {customer.subscriptionId}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Create Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Paid</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(customer.totalPaid * 100)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Commission</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(customer.totalCommission * 100)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Partner</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{customer.partnerName}</div>
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
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'transactions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Transactions ({transactions.length})
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
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Activity
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Customer Name</div>
                    <div className="font-medium">{customer.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium">{customer.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Partner</div>
                    <div className="font-medium">{customer.partnerName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Customer Since</div>
                    <div className="font-medium">{formatDate(customer.createdAt)}</div>
                  </div>
                  {customer.subscriptionId && (
                    <div>
                      <div className="text-sm text-gray-600">Subscription ID</div>
                      <div className="font-medium font-mono text-sm">{customer.subscriptionId}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Transactions</div>
                    <div className="text-2xl font-bold">{transactions.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(transactions.reduce((sum, t) => sum + t.amountCents, 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Create Transaction
                </button>
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No transactions yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create First Transaction
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(txn.paidAt || txn.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(txn.amountCents)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                            {formatCurrency(txn.commissionCents)}
                            <span className="text-gray-500 ml-1">({(txn.commissionRate * 100).toFixed(0)}%)</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(txn.status)}`}>
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {txn.invoiceId || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {txn.paymentMethod || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => openEditModal(txn)}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(txn.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
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
              <h3 className="text-lg font-semibold mb-4">Commission Breakdown</h3>
              {commissions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No commissions generated yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commissions.map((comm) => (
                        <tr key={comm.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(comm.createdAt)}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {customer.partnerName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {transactions.slice(0, 10).map((txn) => (
                  <div key={txn.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">₹</span>
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">
                        Payment of {formatCurrency(txn.amountCents)} received
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Commission: {formatCurrency(txn.commissionCents)} ({(txn.commissionRate * 100).toFixed(0)}%)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(txn.paidAt || txn.createdAt)}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No activity yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Transaction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create Transaction</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Monthly subscription payment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice ID
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceId}
                    onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.paidAt}
                    onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {createLoading ? 'Creating...' : 'Create Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Transaction</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) - Read Only
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled
                    value={editFormData.amount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Amount cannot be changed after creation</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Monthly subscription payment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice ID
                  </label>
                  <input
                    type="text"
                    value={editFormData.invoiceId}
                    onChange={(e) => setEditFormData({ ...editFormData, invoiceId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.paidAt}
                    onChange={(e) => setEditFormData({ ...editFormData, paidAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTransaction(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {createLoading ? 'Updating...' : 'Update Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Transaction</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this transaction? This action cannot be undone and will also remove the associated commission.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingTransactionId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTransaction}
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
                >
                  {createLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
