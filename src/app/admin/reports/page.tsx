'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  BarChart3,
  Download,
  FileText,
  Loader2,
  Users,
  Link2,
  IndianRupee,
  Wallet,
  Calendar,
  Clock,
  Mail,
  Plus,
  Trash2,
  Pencil,
  Send,
  TrendingUp,
  CheckCircle2,
  Play,
  Save,
  Layers,
} from 'lucide-react';

// ────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────
type ReportType = 'summary' | 'affiliates' | 'referrals' | 'commissions' | 'payouts';

interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  frequency: string;
  recipients: string[];
  filters: Record<string, unknown>;
  format: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  reportType: string;
  columns: string[];
  filters: Record<string, unknown>;
  sortBy: string | null;
  sortOrder: string | null;
  createdAt: string;
}

interface CohortData {
  cohortKey: string;
  label: string;
  affiliateCount: number;
  totalReferrals: number;
  approvedReferrals: number;
  conversionRate: string;
  totalCommissions: number;
  totalEarningsCents: number;
  avgEarningsPerAffiliateCents: number;
  retention: Record<string, number>;
}

interface CohortAnalysis {
  period: string;
  groupBy: string;
  summary: {
    totalCohorts: number;
    totalAffiliates: number;
    activeAffiliates: number;
    activationRate: string;
    avgReferralsPerAffiliate: string;
  };
  cohorts: CohortData[];
}

// ────────────────────────────────────────────────
//  Constants
// ────────────────────────────────────────────────
const reportTypes: { value: ReportType; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'summary', label: 'Summary', description: 'Overview of all metrics', icon: BarChart3 },
  { value: 'affiliates', label: 'Affiliates', description: 'Partner performance data', icon: Users },
  { value: 'referrals', label: 'Referrals', description: 'Referral lead details', icon: Link2 },
  { value: 'commissions', label: 'Commissions', description: 'Commission records', icon: IndianRupee },
  { value: 'payouts', label: 'Payouts', description: 'Payout history', icon: Wallet },
];

export default function ReportsPage() {
  // ── Standard Report State ──
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [tableRows, setTableRows] = useState<Record<string, unknown>[]>([]);

  // ── Scheduled Reports ──
  const [scheduled, setScheduled] = useState<ScheduledReport[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(true);
  const [schedDialog, setSchedDialog] = useState(false);
  const [editingSched, setEditingSched] = useState<ScheduledReport | null>(null);
  const [schedForm, setSchedForm] = useState({
    name: '',
    reportType: 'summary',
    frequency: 'WEEKLY',
    recipients: '',
    format: 'csv',
  });
  const [savingSched, setSavingSched] = useState(false);

  // ── Custom / Saved Reports ──
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [saveDialog, setSaveDialog] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', description: '' });
  const [savingReport, setSavingReport] = useState(false);

  // ── Cohort ──
  const [cohort, setCohort] = useState<CohortAnalysis | null>(null);
  const [cohortLoading, setCohortLoading] = useState(false);
  const [cohortPeriod, setCohortPeriod] = useState('6m');
  const [cohortGroupBy, setCohortGroupBy] = useState('month');

  // ── Email Delivery ──
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // ── Load data on mount ──
  useEffect(() => {
    fetchScheduled();
    fetchSaved();
  }, []);

  // ───────────── Standard Reports ─────────────
  const fetchReport = async (format: 'json' | 'csv' = 'json') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType, format });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const res = await fetch(`/api/admin/reports?${params}`);
      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json.report || json);
        if (json.report) {
          const report = json.report;
          setTableRows(
            Array.isArray(report) ? report : Array.isArray(report.data) ? report.data : []
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  // ───────────── Scheduled Reports ─────────────
  const fetchScheduled = async () => {
    try {
      const res = await fetch('/api/admin/scheduled-reports');
      const json = await res.json();
      if (json.success) setScheduled(json.reports);
    } catch (error) {
      console.error('Failed to fetch scheduled reports:', error);
    } finally {
      setScheduledLoading(false);
    }
  };

  const handleSaveScheduled = async () => {
    setSavingSched(true);
    try {
      const payload = {
        ...schedForm,
        recipients: schedForm.recipients.split(',').map((e: any) => e.trim()).filter(Boolean),
        ...(editingSched ? { id: editingSched.id } : {}),
      };
      const res = await fetch('/api/admin/scheduled-reports', {
        method: editingSched ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchScheduled();
        setSchedDialog(false);
        setEditingSched(null);
        setSchedForm({ name: '', reportType: 'summary', frequency: 'WEEKLY', recipients: '', format: 'csv' });
      }
    } catch (error) {
      console.error('Failed to save scheduled report:', error);
    } finally {
      setSavingSched(false);
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    if (!confirm('Delete this scheduled report?')) return;
    try {
      await fetch('/api/admin/scheduled-reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchScheduled();
    } catch (error) {
      console.error('Failed to delete scheduled report:', error);
    }
  };

  const handleToggleScheduled = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/scheduled-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      setScheduled((prev: any) => prev.map((s: any) => (s.id === id ? { ...s, isActive: !isActive } : s)));
    } catch (error) {
      console.error('Failed to toggle scheduled report:', error);
    }
  };

  // ───────────── Saved / Custom Reports ─────────────
  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/admin/saved-reports');
      const json = await res.json();
      if (json.success) setSaved(json.reports);
    } catch (error) {
      console.error('Failed to fetch saved reports:', error);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleSaveCustomReport = async () => {
    setSavingReport(true);
    try {
      const payload = {
        name: saveForm.name,
        description: saveForm.description,
        reportType,
        columns: tableRows.length > 0 ? Object.keys(tableRows[0]) : [],
        filters: { startDate, endDate },
      };
      const res = await fetch('/api/admin/saved-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchSaved();
        setSaveDialog(false);
        setSaveForm({ name: '', description: '' });
      }
    } catch (error) {
      console.error('Failed to save custom report:', error);
    } finally {
      setSavingReport(false);
    }
  };

  const handleLoadSaved = (report: SavedReport) => {
    setReportType(report.reportType as ReportType);
    const filters = report.filters as { startDate?: string; endDate?: string };
    if (filters.startDate) setStartDate(filters.startDate);
    if (filters.endDate) setEndDate(filters.endDate);
    setTimeout(() => fetchReport('json'), 100);
  };

  const handleDeleteSaved = async (id: string) => {
    if (!confirm('Delete this saved report?')) return;
    try {
      await fetch('/api/admin/saved-reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchSaved();
    } catch (error) {
      console.error('Failed to delete saved report:', error);
    }
  };

  // ───────────── Cohort Analysis ─────────────
  const fetchCohort = async () => {
    setCohortLoading(true);
    try {
      const params = new URLSearchParams({ period: cohortPeriod, groupBy: cohortGroupBy });
      const res = await fetch(`/api/admin/reports/cohort?${params}`);
      const json = await res.json();
      if (json.success) setCohort(json.cohortAnalysis);
    } catch (error) {
      console.error('Failed to fetch cohort analysis:', error);
    } finally {
      setCohortLoading(false);
    }
  };

  // ───────────── Email Delivery ─────────────
  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailSent(false);
    try {
      const res = await fetch('/api/admin/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          recipients: emailRecipients.split(',').map((e: any) => e.trim()).filter(Boolean),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      if (res.ok) {
        setEmailSent(true);
        setTimeout(() => {
          setEmailSent(false);
          setEmailDialog(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setSendingEmail(false);
    }
  };

  // ───────────── Renderers ─────────────
  const renderSummary = () => {
    if (!data) return null;
    const entries = Object.entries(data).filter(([key]) => !['type', 'generatedAt', 'dateRange', 'period'].includes(key));
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-medium">
                          {typeof v === 'number'
                            ? k.toLowerCase().includes('cents')
                              ? `₽${(v / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : v.toLocaleString()
                            : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {typeof value === 'number'
                    ? key.toLowerCase().includes('cents')
                      ? `₽${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : value.toLocaleString()
                    : String(value)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderTable = () => {
    if (tableRows.length === 0) return null;
    const columns = Object.keys(tableRows[0]);
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="capitalize whitespace-nowrap">
                  {col.replace(/([A-Z])/g, ' $1').trim()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row: any, idx: number) => (
              <TableRow key={idx}>
                {columns.map((col: any) => {
                  const val = row[col];
                  let display: string;
                  if (val === null || val === undefined) display = '—';
                  else if (typeof val === 'number' && col.toLowerCase().includes('cents'))
                    display = `₽${(val / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                  else if (typeof val === 'number') display = val.toLocaleString();
                  else display = String(val);
                  return <TableCell key={col} className="text-sm whitespace-nowrap">{display}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // ────────────────────────────────────────────────
  //  JSX
  // ────────────────────────────────────────────────
  if (loading || scheduledLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate, schedule, and deliver program reports</p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2"><BarChart3 className="h-4 w-4" />Generate</TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2"><Clock className="h-4 w-4" />Scheduled</TabsTrigger>
          <TabsTrigger value="saved" className="gap-2"><Layers className="h-4 w-4" />Saved</TabsTrigger>
          <TabsTrigger value="cohort" className="gap-2"><TrendingUp className="h-4 w-4" />Cohort</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB: Generate ═══════ */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Generate Report</CardTitle>
              <CardDescription>Select a report type and date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type pills */}
              <div>
                <Label className="mb-2 block">Report Type</Label>
                <div className="flex flex-wrap gap-2">
                  {reportTypes.map((rt) => {
                    const Icon = rt.icon;
                    return (
                      <Button key={rt.value} variant={reportType === rt.value ? 'default' : 'outline'} size="sm"
                        onClick={() => { setReportType(rt.value); setData(null); setTableRows([]); }} className="gap-2">
                        <Icon className="h-4 w-4" />{rt.label}
                      </Button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{reportTypes.find((r) => r.value === reportType)?.description}</p>
              </div>

              {/* Date range */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => fetchReport('json')} disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><BarChart3 className="mr-2 h-4 w-4" />Generate</>}
                </Button>
                <Button variant="outline" onClick={() => fetchReport('csv')} disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />Export CSV
                </Button>
                <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Mail className="mr-2 h-4 w-4" />Email Report</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Email Report</DialogTitle>
                      <DialogDescription>Send the current report type to one or more recipients</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label>Report</Label>
                        <Input value={reportTypes.find((r) => r.value === reportType)?.label || reportType} readOnly disabled />
                      </div>
                      <div className="grid gap-2">
                        <Label>Recipients (comma-separated emails)</Label>
                        <Textarea placeholder="admin@company.com, cfo@company.com" value={emailRecipients} onChange={(e) => setEmailRecipients(e.target.value)} rows={3} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
                      <Button onClick={handleSendEmail} disabled={sendingEmail || !emailRecipients.trim()}>
                        {emailSent ? <><CheckCircle2 className="mr-2 h-4 w-4" />Sent!</> : sendingEmail ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send</>}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {tableRows.length > 0 && (
                  <Dialog open={saveDialog} onOpenChange={setSaveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline"><Save className="mr-2 h-4 w-4" />Save Report</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Report Configuration</DialogTitle>
                        <DialogDescription>Save this report for quick access later</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                          <Label>Name</Label>
                          <Input placeholder="e.g., Monthly Affiliate Performance" value={saveForm.name} onChange={(e: any) => setSaveForm({ ...saveForm, name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Description (optional)</Label>
                          <Input placeholder="Brief description" value={saveForm.description} onChange={(e: any) => setSaveForm({ ...saveForm, description: e.target.value })} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveCustomReport} disabled={savingReport || !saveForm.name.trim()}>
                          {savingReport ? 'Saving...' : 'Save'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {data && (
            <Card>
              <CardHeader>
                <CardTitle>{reportTypes.find((r) => r.value === reportType)?.label} Report</CardTitle>
                <CardDescription>{startDate && endDate ? `${new Date(startDate).toLocaleDateString(undefined)} — ${new Date(endDate).toLocaleDateString(undefined)}` : 'All time'}</CardDescription>
              </CardHeader>
              <CardContent>
                {reportType === 'summary' ? renderSummary() : renderTable()}
                {reportType !== 'summary' && tableRows.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">No data</h3>
                    <p className="text-sm text-muted-foreground">No records found for the selected criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════ TAB: Scheduled ═══════ */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Scheduled Reports</CardTitle>
                  <CardDescription>Automated reports delivered on a recurring schedule</CardDescription>
                </div>
                <Dialog open={schedDialog} onOpenChange={setSchedDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingSched(null); setSchedForm({ name: '', reportType: 'summary', frequency: 'WEEKLY', recipients: '', format: 'csv' }); }}>
                      <Plus className="mr-2 h-4 w-4" />New Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSched ? 'Edit Schedule' : 'New Scheduled Report'}</DialogTitle>
                      <DialogDescription>Configure automated report delivery</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input placeholder="e.g., Weekly Performance Summary" value={schedForm.name} onChange={(e) => setSchedForm({ ...schedForm, name: e.target.value })} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Report Type</Label>
                          <Select value={schedForm.reportType} onValueChange={(v) => setSchedForm({ ...schedForm, reportType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {reportTypes.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Frequency</Label>
                          <Select value={schedForm.frequency} onValueChange={(v) => setSchedForm({ ...schedForm, frequency: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DAILY">Daily</SelectItem>
                              <SelectItem value="WEEKLY">Weekly</SelectItem>
                              <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Recipients (comma-separated emails)</Label>
                        <Textarea placeholder="admin@company.com, manager@company.com" value={schedForm.recipients} onChange={(e) => setSchedForm({ ...schedForm, recipients: e.target.value })} rows={2} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Format</Label>
                        <Select value={schedForm.format} onValueChange={(v) => setSchedForm({ ...schedForm, format: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSchedDialog(false)}>Cancel</Button>
                      <Button onClick={handleSaveScheduled} disabled={savingSched || !schedForm.name || !schedForm.recipients}>
                        {savingSched ? 'Saving...' : editingSched ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {scheduledLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : scheduled.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No scheduled reports</h3>
                  <p className="text-sm text-muted-foreground">Set up automated report delivery</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduled.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell><Badge variant="outline">{s.reportType}</Badge></TableCell>
                        <TableCell className="text-sm">{s.frequency}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{(s.recipients as string[]).length} recipient(s)</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.nextRunAt ? new Date(s.nextRunAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'}
                        </TableCell>
                        <TableCell><Switch checked={s.isActive} onCheckedChange={() => handleToggleScheduled(s.id, s.isActive)} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingSched(s);
                              setSchedForm({
                                name: s.name,
                                reportType: s.reportType,
                                frequency: s.frequency,
                                recipients: (s.recipients as string[]).join(', '),
                                format: s.format,
                              });
                              setSchedDialog(true);
                            }}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteScheduled(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB: Saved Reports ═══════ */}
        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" />Saved Reports</CardTitle>
              <CardDescription>Your saved report configurations for quick access</CardDescription>
            </CardHeader>
            <CardContent>
              {savedLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : saved.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No saved reports</h3>
                  <p className="text-sm text-muted-foreground">Generate a report and click &quot;Save Report&quot; to save it here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saved.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell><Badge variant="outline">{r.reportType}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.description || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleLoadSaved(r)}>
                              <Play className="mr-1 h-3.5 w-3.5" />Run
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSaved(r.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB: Cohort Analysis ═══════ */}
        <TabsContent value="cohort" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Cohort Analysis</CardTitle>
                  <CardDescription>Analyze affiliate behavior and retention by join date</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={cohortPeriod} onValueChange={setCohortPeriod}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3m">3 months</SelectItem>
                      <SelectItem value="6m">6 months</SelectItem>
                      <SelectItem value="12m">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={cohortGroupBy} onValueChange={setCohortGroupBy}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">By Week</SelectItem>
                      <SelectItem value="month">By Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchCohort} disabled={cohortLoading}>
                    {cohortLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                    Analyze
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cohort ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Cohorts</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{cohort.summary.totalCohorts}</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Affiliates</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{cohort.summary.totalAffiliates}</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Affiliates</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{cohort.summary.activeAffiliates}</div></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Activation Rate</CardTitle></CardHeader>
                      <CardContent><div className="text-2xl font-bold">{cohort.summary.activationRate}%</div></CardContent>
                    </Card>
                  </div>

                  {/* Cohort Table */}
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cohort</TableHead>
                          <TableHead className="text-right">Affiliates</TableHead>
                          <TableHead className="text-right">Referrals</TableHead>
                          <TableHead className="text-right">Approved</TableHead>
                          <TableHead className="text-right">Conv. Rate</TableHead>
                          <TableHead className="text-right">Commissions</TableHead>
                          <TableHead className="text-right">Total Earnings</TableHead>
                          <TableHead className="text-right">Avg / Affiliate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cohort.cohorts.map((c) => (
                          <TableRow key={c.cohortKey}>
                            <TableCell className="font-medium whitespace-nowrap">{c.label}</TableCell>
                            <TableCell className="text-right">{c.affiliateCount}</TableCell>
                            <TableCell className="text-right">{c.totalReferrals}</TableCell>
                            <TableCell className="text-right">{c.approvedReferrals}</TableCell>
                            <TableCell className="text-right">{c.conversionRate}%</TableCell>
                            <TableCell className="text-right">{c.totalCommissions}</TableCell>
                            <TableCell className="text-right font-medium">
                              ₽{(c.totalEarningsCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              ₽{(c.avgEarningsPerAffiliateCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Run cohort analysis</h3>
                  <p className="text-sm text-muted-foreground">Select a period and grouping, then click Analyze</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-36 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
