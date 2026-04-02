'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileText, Plus, Eye, IndianRupee, CheckCircle2, Clock, AlertCircle, Trash2,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  affiliateId: string;
  amountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  status: string;
  lineItems: any[];
  billingInfo: any;
  notes?: string;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    affiliateId: '', amountCents: '', taxCents: '0', notes: '', dueAt: '',
  });

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/admin/invoices');
      const data = await res.json();
      if (data.success) setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: form.affiliateId,
          amountCents: parseInt(form.amountCents),
          taxCents: parseInt(form.taxCents) || 0,
          notes: form.notes || null,
          dueAt: form.dueAt || null,
        }),
      });
      if (res.ok) {
        await fetchInvoices();
        setDialogOpen(false);
        setForm({ affiliateId: '', amountCents: '', taxCents: '0', notes: '', dueAt: '' });
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/admin/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`/api/admin/invoices?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchInvoices();
      } else {
        alert(data.error || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  const formatCurrency = (cents: number) =>
    `\u20B9${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
      PAID: { variant: 'default', icon: CheckCircle2 },
      ISSUED: { variant: 'secondary', icon: Clock },
      DRAFT: { variant: 'outline', icon: FileText },
      OVERDUE: { variant: 'destructive', icon: AlertCircle },
      CANCELLED: { variant: 'destructive', icon: AlertCircle },
    };
    const { variant, icon: Icon } = map[status] || { variant: 'outline' as const, icon: Clock };
    return (
      <Badge variant={variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    outstanding: invoices.filter(i => ['ISSUED', 'OVERDUE'].includes(i.status)).reduce((s, i) => s + i.totalCents, 0),
    totalRevenue: invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalCents, 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Generate and manage payout invoices</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.paid}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.outstanding)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>Track and manage affiliate payout invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No invoices yet</h3>
              <p className="text-sm text-muted-foreground">Create your first payout invoice</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{inv.affiliateId.slice(0, 8)}...</TableCell>
                    <TableCell>{formatCurrency(inv.amountCents)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatCurrency(inv.taxCents)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(inv.totalCents)}</TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.issuedAt ? formatDate(inv.issuedAt) : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.dueAt ? formatDate(inv.dueAt) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewInvoice(inv)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {inv.status === 'ISSUED' && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatus(inv.id, 'PAID')}>
                            Mark Paid
                          </Button>
                        )}
                        {inv.status !== 'PAID' && (
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(inv.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Generate a new payout invoice for an affiliate</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Affiliate ID *</Label>
              <Input value={form.affiliateId} onChange={e => setForm({...form, affiliateId: e.target.value})} placeholder="Affiliate ID" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount (cents) *</Label>
                <Input type="number" value={form.amountCents} onChange={e => setForm({...form, amountCents: e.target.value})} placeholder="100000" />
                <p className="text-xs text-muted-foreground">100000 = ₽1,000</p>
              </div>
              <div className="grid gap-2">
                <Label>Tax (cents)</Label>
                <Input type="number" value={form.taxCents} onChange={e => setForm({...form, taxCents: e.target.value})} placeholder="0" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueAt} onChange={e => setForm({...form, dueAt: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.affiliateId || !form.amountCents}>
              {saving ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(viewInvoice.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Affiliate</p>
                  <p className="font-mono mt-1">{viewInvoice.affiliateId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold mt-1">{formatCurrency(viewInvoice.amountCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax</p>
                  <p className="mt-1">{formatCurrency(viewInvoice.taxCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-lg mt-1">{formatCurrency(viewInvoice.totalCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="mt-1">{viewInvoice.dueAt ? formatDate(viewInvoice.dueAt) : '—'}</p>
                </div>
              </div>
              {viewInvoice.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p className="text-sm mt-1">{viewInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
