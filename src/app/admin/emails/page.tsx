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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Plus,
  Send,
  Eye,
  Pencil,
  Trash2,
  MailCheck,
  MailX,
  Code,
  Variable,
  TestTube,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  sentCount: number;
  lastSent: string | null;
  createdAt: string;
}

const AVAILABLE_VARIABLES = [
  { name: 'name', desc: 'Recipient name' },
  { name: 'email', desc: 'Recipient email' },
  { name: 'code', desc: 'OTP or referral code' },
  { name: 'amount', desc: 'Payout amount' },
  { name: 'referralCode', desc: 'Referral code' },
  { name: 'companyName', desc: 'Company name' },
  { name: 'dashboardUrl', desc: 'Dashboard link' },
  { name: 'reason', desc: 'Approval/rejection reason' },
];

const typeColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  WELCOME: 'default',
  OTP: 'secondary',
  APPROVAL: 'default',
  REJECTION: 'destructive',
  PAYOUT: 'outline',
  NOTIFICATION: 'secondary',
};

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testTemplateId, setTestTemplateId] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showSourceView, setShowSourceView] = useState(false);
  const [form, setForm] = useState({ type: '', name: '', subject: '', body: '', variables: '' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: !isActive } : t))
      );
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this email template?')) return;
    try {
      await fetch('/api/admin/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        variables: form.variables.split(',').map((v) => v.trim()).filter(Boolean),
        ...(editing ? { id: editing.id } : {}),
      };
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchTemplates();
        setDialogOpen(false);
        setEditing(null);
        setForm({ type: '', name: '', subject: '', body: '', variables: '' });
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setForm({
      type: t.type,
      name: t.name,
      subject: t.subject,
      body: t.body,
      variables: t.variables.join(', '),
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ type: '', name: '', subject: '', body: '', variables: '' });
    setShowSourceView(false);
    setDialogOpen(true);
  };

  const insertVariable = (varName: string) => {
    const tag = `{{${varName}}}`;
    setForm(prev => ({ ...prev, body: prev.body + tag }));
    // Also add to variables list if not present
    const vars = prev_variables_from(form.variables);
    if (!vars.includes(varName)) {
      setForm(prev => ({ ...prev, variables: vars.concat(varName).join(', ') }));
    }
  };

  function prev_variables_from(v: string) {
    return v.split(',').map(s => s.trim()).filter(Boolean);
  }

  const openPreview = (t: EmailTemplate) => {
    setPreviewTemplate(t);
    setPreviewOpen(true);
  };

  const openTestSend = (id: string) => {
    setTestTemplateId(id);
    setTestEmail('');
    setTestEmailOpen(true);
  };

  const handleTestSend = async () => {
    if (!testEmail || !testTemplateId) return;
    setSendingTest(true);
    try {
      const res = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: testTemplateId, email: testEmail }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Test email sent successfully!');
        setTestEmailOpen(false);
      } else {
        alert(data.error || 'Failed to send test email');
      }
    } catch (error) {
      alert('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.isActive).length,
    totalSent: templates.reduce((s, t) => s + t.sentCount, 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emails</h1>
          <p className="text-muted-foreground">Manage email templates and notifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Template' : 'New Email Template'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Update the email template details' : 'Create a new email notification template'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WELCOME">Welcome</SelectItem>
                    <SelectItem value="OTP">OTP</SelectItem>
                    <SelectItem value="APPROVAL">Approval</SelectItem>
                    <SelectItem value="REJECTION">Rejection</SelectItem>
                    <SelectItem value="PAYOUT">Payout</SelectItem>
                    <SelectItem value="NOTIFICATION">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Email subject line"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Body</Label>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowSourceView(!showSourceView)}>
                      {showSourceView ? <Eye className="h-3 w-3" /> : <Code className="h-3 w-3" />}
                      {showSourceView ? 'Preview' : 'Source'}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  <span className="text-xs text-muted-foreground mr-1 py-1">Insert:</span>
                  {AVAILABLE_VARIABLES.map(v => (
                    <Button
                      key={v.name}
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 font-mono"
                      onClick={() => insertVariable(v.name)}
                      title={v.desc}
                    >
                      {'{{' + v.name + '}}'}
                    </Button>
                  ))}
                </div>
                {showSourceView ? (
                  <div className="border rounded-md p-3 text-sm max-h-48 overflow-auto bg-muted/50">
                    <div dangerouslySetInnerHTML={{ __html: form.body || '<p class="text-muted-foreground">No content to preview</p>' }} />
                  </div>
                ) : (
                  <Textarea
                    id="body"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Email body (HTML supported). Use {{variable}} for dynamic content."
                    rows={8}
                    className="font-mono text-sm"
                  />
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="variables">Variables (comma-separated)</Label>
                <Input
                  id="variables"
                  value={form.variables}
                  onChange={(e) => setForm({ ...form, variables: e.target.value })}
                  placeholder="e.g., name, email, code"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.type || !form.name || !form.subject}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <MailCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Configure automated email notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MailX className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No templates yet</h3>
              <p className="text-sm text-muted-foreground">Create your first email template</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Last Sent</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant={typeColors[t.type] || 'outline'}>{t.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{t.subject}</TableCell>
                    <TableCell className="text-sm">{t.sentCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.lastSent
                        ? new Date(t.lastSent).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Switch checked={t.isActive} onCheckedChange={() => handleToggle(t.id, t.isActive)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Preview" onClick={() => openPreview(t)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Test Send" onClick={() => openTestSend(t.id)}>
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
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

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>Subject: {previewTemplate?.subject}</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Variables:</span>
                {previewTemplate.variables.map(v => (
                  <Badge key={v} variant="outline" className="text-xs font-mono">{'{{' + v + '}}'}</Badge>
                ))}
              </div>
              <div className="border rounded-lg p-4 bg-white">
                <div dangerouslySetInnerHTML={{ __html: previewTemplate.body }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Send Dialog */}
      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Send a test email to verify the template</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Variables will be replaced with sample data for testing.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleTestSend} disabled={sendingTest || !testEmail}>
              <Send className="mr-2 h-4 w-4" />
              {sendingTest ? 'Sending...' : 'Send Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
