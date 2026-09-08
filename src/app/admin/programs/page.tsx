"use client";
import { useI18n } from "@/i18n/provider";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Plus,
  Star,
  Percent,
  Clock,
  Globe,
  Edit,
  Trash2,
} from "lucide-react";

interface Program {
  id: string;
  name: string;
  slug: string;
  description?: string;
  commissionRate: number;
  commissionType: string;
  cookieDuration: number;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  autoApprove: boolean;
  minPayoutCents: number;
  payoutFrequency: string;
  termsUrl?: string;
  logoUrl?: string;
  brandColor?: string;
  createdAt: string;
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  commissionRate: "20",
  commissionType: "PERCENTAGE",
  cookieDuration: "30",
  currency: "INR",
  autoApprove: false,
  minPayoutCents: "100000",
  payoutFrequency: "MONTHLY",
  termsUrl: "",
  logoUrl: "",
  brandColor: "#6366f1",
};

export default function ProgramsPage() {
  const { t: __tr, getIntlLocale: __locale } = useI18n();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/admin/programs");
      const data = await res.json();
      if (data.success) setPrograms(data.programs || []);
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      commissionRate: String(p.commissionRate),
      commissionType: p.commissionType,
      cookieDuration: String(p.cookieDuration),
      currency: p.currency,
      autoApprove: p.autoApprove,
      minPayoutCents: String(p.minPayoutCents),
      payoutFrequency: p.payoutFrequency,
      termsUrl: p.termsUrl || "",
      logoUrl: p.logoUrl || "",
      brandColor: p.brandColor || "#6366f1",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: any = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        commissionRate: parseFloat(form.commissionRate),
        commissionType: form.commissionType,
        cookieDuration: parseInt(form.cookieDuration),
        currency: form.currency,
        autoApprove: form.autoApprove,
        minPayoutCents: parseInt(form.minPayoutCents),
        payoutFrequency: form.payoutFrequency,
        termsUrl: form.termsUrl || null,
        logoUrl: form.logoUrl || null,
        brandColor: form.brandColor || null,
      };
      if (editing) body.id = editing.id;

      const res = await fetch("/api/admin/programs", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPrograms();
        setDialogOpen(false);
      } else {
        alert(data.error || __tr("Failed to save program"));
      }
    } catch (error) {
      console.error("Failed to save program:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/admin/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      await fetchPrograms();
    } catch (error) {
      console.error("Failed to toggle program:", error);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await fetch("/api/admin/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      // Unset all others locally — API should handle this too
      await fetchPrograms();
    } catch (error) {
      console.error("Failed to set default:", error);
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm(__tr("Delete this program? This cannot be undone."))) return;
    try {
      await fetch(`/api/admin/programs?id=${id}`, { method: "DELETE" });
      await fetchPrograms();
    } catch (error) {
      console.error("Failed to delete program:", error);
    }
  };

  const formatCurrency = (cents: number, currency: string = "INR") => {
    const symbol =
      currency === "INR"
        ? "\u20B9"
        : currency === "USD"
          ? "$"
          : currency === "EUR"
            ? "\u20AC"
            : currency;
    return `${symbol}${(cents / 100).toLocaleString(__locale(), { minimumFractionDigits: 0 })}`;
  };

  const stats = {
    total: programs.length,
    active: programs.filter((p) => p.isActive).length,
    defaultProgram: programs.find((p) => p.isDefault),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {__tr("Programs")}
          </h1>
          <p className="text-muted-foreground">
            {__tr(
              "Manage multiple affiliate programs with different commission structures",
            )}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {__tr("Create Program")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {__tr("Total Programs")}
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {__tr("Active items")}
            </CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {__tr("Default Program")}
            </CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats.defaultProgram?.name || __tr("Not set")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{__tr("All Programs")}</CardTitle>
          <CardDescription>
            {__tr(
              "Configure commission rates, cookie durations, and payout rules per program",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                {__tr("No programs yet")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {__tr("Create your first affiliate program")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{__tr("Program")}</TableHead>
                  <TableHead>{__tr("Commission")}</TableHead>
                  <TableHead>{__tr("Cookie")}</TableHead>
                  <TableHead>{__tr("Min Payout")}</TableHead>
                  <TableHead>{__tr("Frequency")}</TableHead>
                  <TableHead>{__tr("Auto-Approve")}</TableHead>
                  <TableHead>{__tr("Status")}</TableHead>
                  <TableHead className="text-right">
                    {__tr("Actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.brandColor && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: p.brandColor }}
                          />
                        )}
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            /{p.slug}
                          </p>
                        </div>
                        {p.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            {__tr("Default")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold">
                          {p.commissionRate}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.commissionType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {p.cookieDuration}
                        {__tr("d")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(p.minPayoutCents, p.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {p.payoutFrequency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.autoApprove ? "default" : "outline"}
                        className="text-xs"
                      >
                        {p.autoApprove ? __tr("Yes") : __tr("Manual")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={(v) => toggleActive(p.id, v)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!p.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefault(p.id)}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {__tr("Set Default")}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!p.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProgram(p.id)}
                          >
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

      {/* Create/Edit Program Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? __tr("Edit Program") : __tr("Create Program")}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? __tr("Update program configuration")
                : __tr("Set up a new affiliate program")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{__tr("Program Name *")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={__tr("Premium Partners")}
                />
              </div>
              <div className="grid gap-2">
                <Label>{__tr("Slug *")}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  placeholder="premium-partners"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{__tr("Description")}</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder={__tr("Describe this program...")}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>{__tr("Commission Rate (%)")}</Label>
                <Input
                  type="number"
                  value={form.commissionRate}
                  onChange={(e) =>
                    setForm({ ...form, commissionRate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{__tr("Commission Type")}</Label>
                <Select
                  value={form.commissionType}
                  onValueChange={(v) => setForm({ ...form, commissionType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">
                      {__tr("Percentage")}
                    </SelectItem>
                    <SelectItem value="FIXED">
                      {__tr("Fixed Amount")}
                    </SelectItem>
                    <SelectItem value="TIERED">{__tr("Tiered")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{__tr("Cookie Duration (days)")}</Label>
                <Input
                  type="number"
                  value={form.cookieDuration}
                  onChange={(e) =>
                    setForm({ ...form, cookieDuration: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>{__tr("Currency")}</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{__tr("Min Payout (cents)")}</Label>
                <Input
                  type="number"
                  value={form.minPayoutCents}
                  onChange={(e) =>
                    setForm({ ...form, minPayoutCents: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>{__tr("Payout Frequency")}</Label>
                <Select
                  value={form.payoutFrequency}
                  onValueChange={(v) =>
                    setForm({ ...form, payoutFrequency: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">{__tr("Weekly")}</SelectItem>
                    <SelectItem value="BIWEEKLY">
                      {__tr("Bi-Weekly")}
                    </SelectItem>
                    <SelectItem value="MONTHLY">{__tr("Monthly")}</SelectItem>
                    <SelectItem value="QUARTERLY">
                      {__tr("Quarterly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{__tr("Brand Color")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={form.brandColor}
                    onChange={(e) =>
                      setForm({ ...form, brandColor: e.target.value })
                    }
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={form.brandColor}
                    onChange={(e) =>
                      setForm({ ...form, brandColor: e.target.value })
                    }
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{__tr("Logo URL")}</Label>
                <Input
                  value={form.logoUrl}
                  onChange={(e) =>
                    setForm({ ...form, logoUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{__tr("Terms URL")}</Label>
              <Input
                value={form.termsUrl}
                onChange={(e) => setForm({ ...form, termsUrl: e.target.value })}
                placeholder="https://yoursite.com/terms"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.autoApprove as boolean}
                onCheckedChange={(v) => setForm({ ...form, autoApprove: v })}
              />
              <Label>{__tr("Auto-approve new affiliates")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {__tr("Cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.slug}
            >
              {saving
                ? __tr("Saving...")
                : editing
                  ? __tr("Update Program")
                  : __tr("Create Program")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
