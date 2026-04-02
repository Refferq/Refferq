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
  Users, Plus, UserPlus, Shield, Eye, Trash2, Mail, UserCheck, UserX,
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  permissions: any;
  invitedBy: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

const ROLES = [
  { value: 'OWNER', label: 'Owner', description: 'Full access to everything' },
  { value: 'ADMIN', label: 'Admin', description: 'Full access except billing' },
  { value: 'MANAGER', label: 'Manager', description: 'Manage affiliates and payouts' },
  { value: 'VIEWER', label: 'Viewer', description: 'View-only access' },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'MANAGER' });

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      if (data.success) setMembers(data.members || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMembers();
        setDialogOpen(false);
        setForm({ email: '', name: '', role: 'MANAGER' });
      } else {
        alert(data.error || 'Failed to invite member');
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      await fetch('/api/admin/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      await fetchMembers();
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  };

  const deleteMember = async (id: string) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await fetch(`/api/admin/team?id=${id}`, { method: 'DELETE' });
      await fetchMembers();
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, 'default' | 'secondary' | 'outline'> = {
      OWNER: 'default', ADMIN: 'default', MANAGER: 'secondary', VIEWER: 'outline',
    };
    return <Badge variant={map[role] || 'outline'}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => (
    <Badge variant={status === 'ACTIVE' ? 'default' : status === 'PENDING' ? 'secondary' : 'destructive'} className="gap-1 text-xs">
      {status === 'ACTIVE' ? <UserCheck className="h-3 w-3" /> : status === 'PENDING' ? <Mail className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
      {status}
    </Badge>
  );

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'ACTIVE').length,
    pending: members.filter(m => m.status === 'PENDING').length,
    admins: members.filter(m => ['OWNER', 'ADMIN'].includes(m.role)).length,
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
          <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage who has access to your admin dashboard</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.admins}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>People with access to the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No team members</h3>
              <p className="text-sm text-muted-foreground">Invite your first team member</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {member.status === 'PENDING' && (
                          <Button variant="ghost" size="sm" onClick={() => updateMember(member.id, { status: 'ACTIVE' })}>
                            Activate
                          </Button>
                        )}
                        {member.status === 'ACTIVE' && member.role !== 'OWNER' && (
                          <Button variant="ghost" size="sm" onClick={() => updateMember(member.id, { status: 'DEACTIVATED' })}>
                            Deactivate
                          </Button>
                        )}
                        {member.role !== 'OWNER' && (
                          <Button variant="ghost" size="icon" onClick={() => deleteMember(member.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Invite Member Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your admin team</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.com" />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <span className="font-medium">{role.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={saving || !form.email || !form.name}>
              {saving ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
