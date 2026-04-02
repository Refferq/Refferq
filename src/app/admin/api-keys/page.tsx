'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  maskedKey: string;
  scopes: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  _count?: { usageLogs: number };
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: '',
    rateLimit: '100',
    expiresIn: 'never',
    scopes: ['read'] as string[],
  });

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/api-keys');
      const json = await res.json();
      if (json.success) setKeys(json.apiKeys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        rateLimit: parseInt(form.rateLimit, 10),
        scopes: form.scopes,
      };
      if (form.expiresIn !== 'never') {
        const days = parseInt(form.expiresIn, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        payload.expiresAt = expiresAt.toISOString();
      }
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setNewKeySecret(json.apiKey.key);
        await fetchKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, isActive: !isActive } : k)));
    } catch (error) {
      console.error('Failed to toggle API key:', error);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return;
    try {
      await fetch('/api/admin/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await fetchKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const resetAndClose = () => {
    setCreateDialog(false);
    setNewKeySecret(null);
    setCopied(false);
    setForm({ name: '', rateLimit: '100', expiresIn: 'never', scopes: ['read'] });
  };

  const activeCount = keys.filter((k) => k.isActive).length;
  const totalUsage = keys.reduce((sum, k) => sum + (k._count?.usageLogs || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">Manage API keys for programmatic access</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Keys</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{keys.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Keys</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total API Calls</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />API Keys</CardTitle>
              <CardDescription>Create and manage API keys for external integrations</CardDescription>
            </div>
            <Dialog open={createDialog} onOpenChange={(open) => { if (!open) resetAndClose(); else setCreateDialog(true); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Create Key</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                {newKeySecret ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" />API Key Created</DialogTitle>
                      <DialogDescription>Copy this key now — it will not be shown again</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>This is the only time the full key will be displayed. Store it securely.</AlertDescription>
                      </Alert>
                      <div className="flex items-center gap-2">
                        <Input value={newKeySecret} readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="icon" onClick={() => handleCopy(newKeySecret)}>
                          {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={resetAndClose}>Done</Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create API Key</DialogTitle>
                      <DialogDescription>Generate a new key for programmatic access</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input placeholder="e.g., Production Integration" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Rate Limit (req/min)</Label>
                          <Input type="number" min="1" max="10000" value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Expiration</Label>
                          <Select value={form.expiresIn} onValueChange={(v) => setForm({ ...form, expiresIn: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="never">Never</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                              <SelectItem value="180">180 days</SelectItem>
                              <SelectItem value="365">1 year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Scopes</Label>
                        <div className="flex flex-wrap gap-2">
                          {['read', 'write', 'admin'].map((scope) => (
                            <Button key={scope} variant={form.scopes.includes(scope) ? 'default' : 'outline'} size="sm"
                              onClick={() => toggleScope(scope)} className="capitalize gap-1">
                              <Shield className="h-3.5 w-3.5" />{scope}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Select one or more permission scopes</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
                      <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                        {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Key'}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <KeyRound className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No API keys</h3>
              <p className="text-sm text-muted-foreground">Create your first API key to start integrating</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead className="text-right">Rate Limit</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => {
                  const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
                  return (
                    <TableRow key={key.id} className={isExpired ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">{key.maskedKey}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(key.scopes as string[]).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs capitalize">{s}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{key.rateLimit}/min</TableCell>
                      <TableCell className="text-right text-sm">{(key._count?.usageLogs || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.lastUsedAt
                          ? new Date(key.lastUsedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {key.expiresAt ? (
                          <span className={isExpired ? 'text-destructive' : 'text-muted-foreground'}>
                            {isExpired ? 'Expired' : new Date(key.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch checked={key.isActive && !isExpired} disabled={!!isExpired} onCheckedChange={() => handleToggle(key.id, key.isActive)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRevoke(key.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">API Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Include your API key in the <code className="rounded bg-muted px-1.5 py-0.5 text-xs">x-api-key</code> header:
          </p>
          <div className="rounded-md bg-muted p-4 font-mono text-sm">
            <span className="text-blue-600">curl</span> -H <span className="text-green-600">&quot;x-api-key: rfq_your_key_here&quot;</span> \<br />
            &nbsp;&nbsp;{typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/admin/reports
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
