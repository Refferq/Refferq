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
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings2,
  Save,
  Plus,
  Pencil,
  Trash2,
  Percent,
  IndianRupee,
  CheckCircle2,
  Globe,
  Code2,
  Copy,
  ExternalLink,
  Zap,
  Clock,
} from "lucide-react";

interface ProgramSettings {
  id: string;
  programId: string;
  productName: string;
  programName: string;
  websiteUrl: string;
  currency: string;
  portalSubdomain: string;
  minimumPayoutThreshold: number;
  payoutTerm: string;
  commissionHoldDays: number;
  commissionRules: CommissionRule[];
}

interface CommissionRule {
  id: string;
  name: string;
  type: string;
  value: number;
  conditions: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function ProgramSettingsPage() {
  const { t: __tr, label: __label, rich: __rich } = useI18n();

  const [settings, setSettings] = useState<ProgramSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Commission rule dialog
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "PERCENTAGE",
    value: "",
    isDefault: false,
  });
  const [savingRule, setSavingRule] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopySnippet = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: settings.productName,
          programName: settings.programName,
          websiteUrl: settings.websiteUrl,
          currency: settings.currency,
          portalSubdomain: settings.portalSubdomain,
          minimumPayoutThreshold: settings.minimumPayoutThreshold,
          payoutTerm: settings.payoutTerm,
          commissionHoldDays: settings.commissionHoldDays,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRule = async () => {
    setSavingRule(true);
    try {
      const action = editingRule ? "update" : "create";
      const ruleData = editingRule
        ? {
            id: editingRule.id,
            name: ruleForm.name,
            type: ruleForm.type,
            value: parseFloat(ruleForm.value),
            isDefault: ruleForm.isDefault,
          }
        : {
            name: ruleForm.name,
            type: ruleForm.type,
            value: parseFloat(ruleForm.value),
            isDefault: ruleForm.isDefault,
          };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ruleData }),
      });
      if (res.ok) {
        await fetchSettings();
        setRuleDialog(false);
        setEditingRule(null);
        setRuleForm({
          name: "",
          type: "PERCENTAGE",
          value: "",
          isDefault: false,
        });
      }
    } catch (error) {
      console.error("Failed to save rule:", error);
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm(__tr("Delete this commission rule?"))) return;
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ruleData: { id } }),
      });
      await fetchSettings();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm({ name: "", type: "PERCENTAGE", value: "", isDefault: false });
    setRuleDialog(true);
  };

  const openEditRule = (rule: CommissionRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      type: rule.type,
      value: String(rule.value),
      isDefault: rule.isDefault,
    });
    setRuleDialog(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">
          {__tr("Failed to load settings")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {__tr("Program Settings")}
        </h1>
        <p className="text-muted-foreground">
          {__tr("Configure your affiliate program")}
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                {__tr("General Settings")}
              </CardTitle>
              <CardDescription>
                {__tr("Basic program configuration")}
              </CardDescription>
            </div>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  {__tr("Saved")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? __tr("Saving...") : __tr("Save Changes")}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="productName">{__tr("Product Name")}</Label>
              <Input
                id="productName"
                value={settings.productName}
                onChange={(e) =>
                  setSettings({ ...settings, productName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="programName">{__tr("Program Name")}</Label>
              <Input
                id="programName"
                value={settings.programName}
                onChange={(e) =>
                  setSettings({ ...settings, programName: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="websiteUrl">{__tr("Website URL")}</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="websiteUrl"
                  className="pl-9"
                  value={settings.websiteUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, websiteUrl: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="portalSubdomain">
                {__tr("Portal Subdomain")}
              </Label>
              <Input
                id="portalSubdomain"
                value={settings.portalSubdomain}
                onChange={(e) =>
                  setSettings({ ...settings, portalSubdomain: e.target.value })
                }
              />
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="currency">{__tr("Currency")}</Label>
              <Select
                value={settings.currency}
                onValueChange={(v) => setSettings({ ...settings, currency: v })}
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
              <Label htmlFor="minimumPayoutThreshold">
                {__tr("Min Payout Threshold (cents)")}
              </Label>
              <Input
                id="minimumPayoutThreshold"
                type="number"
                value={settings.minimumPayoutThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minimumPayoutThreshold: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payoutTerm">{__tr("Payout Term")}</Label>
              <Select
                value={settings.payoutTerm}
                onValueChange={(v) =>
                  setSettings({ ...settings, payoutTerm: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NET-15">{__tr("NET-15")}</SelectItem>
                  <SelectItem value="NET-30">{__tr("NET-30")}</SelectItem>
                  <SelectItem value="NET-60">{__tr("NET-60")}</SelectItem>
                  <SelectItem value="NET-90">{__tr("NET-90")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="commissionHoldDays">
                {__tr("Commission Hold Period (Days)")}
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="commissionHoldDays"
                  type="number"
                  className="pl-9"
                  value={settings.commissionHoldDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      commissionHoldDays: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="30"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {__tr(
                  "Number of days to hold commissions for refund protection",
                )}
              </p>
            </div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              {__tr("Program ID:")}{" "}
              <span className="font-mono">{settings.programId}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Commission Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                {__tr("Commission Rules")}
              </CardTitle>
              <CardDescription>
                {__tr("Define how commissions are calculated")}
              </CardDescription>
            </div>
            <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={openCreateRule}>
                  <Plus className="mr-2 h-4 w-4" />
                  {__tr("Add Rule")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRule
                      ? __tr("Edit Rule")
                      : __tr("New Commission Rule")}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRule
                      ? __tr("Update commission rule details")
                      : __tr("Create a new commission calculation rule")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>{__tr("Rule Name")}</Label>
                    <Input
                      value={ruleForm.name}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, name: e.target.value })
                      }
                      placeholder={__tr("e.g., Standard Commission")}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>{__tr("Type")}</Label>
                      <Select
                        value={ruleForm.type}
                        onValueChange={(v) =>
                          setRuleForm({ ...ruleForm, type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">
                            {__tr("Percentage")}
                          </SelectItem>
                          <SelectItem value="FLAT">
                            {__tr("Flat Amount")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{__tr("Value")}</Label>
                      <div className="relative">
                        {ruleForm.type === "PERCENTAGE" ? (
                          <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        )}
                        <Input
                          type="number"
                          className={ruleForm.type === "FLAT" ? "pl-9" : ""}
                          value={ruleForm.value}
                          onChange={(e) =>
                            setRuleForm({ ...ruleForm, value: e.target.value })
                          }
                          placeholder={
                            ruleForm.type === "PERCENTAGE" ? "10" : "500"
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ruleForm.isDefault}
                      onCheckedChange={(v) =>
                        setRuleForm({ ...ruleForm, isDefault: v })
                      }
                    />
                    <Label>{__tr("Set as default rule")}</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRuleDialog(false)}
                  >
                    {__tr("Cancel")}
                  </Button>
                  <Button
                    onClick={handleSaveRule}
                    disabled={savingRule || !ruleForm.name || !ruleForm.value}
                  >
                    {savingRule
                      ? __tr("Saving...")
                      : editingRule
                        ? __tr("Update")
                        : __tr("Create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {settings.commissionRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Percent className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                {__tr("No commission rules")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {__tr("Create your first commission rule to get started")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{__tr("Name")}</TableHead>
                  <TableHead>{__tr("Type")}</TableHead>
                  <TableHead>{__tr("Value")}</TableHead>
                  <TableHead>{__tr("Default")}</TableHead>
                  <TableHead>{__tr("Active")}</TableHead>
                  <TableHead className="text-right">
                    {__tr("Actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.commissionRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{__label(rule.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.type === "PERCENTAGE"
                        ? `${rule.value}%`
                        : `₹${rule.value}`}
                    </TableCell>
                    <TableCell>
                      {rule.isDefault && (
                        <Badge variant="default">{__tr("Default")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? __tr("Active") : __tr("Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditRule(rule)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
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

      {/* Tracking Widget / Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            {__tr("Referral Tracking Widget")}
          </CardTitle>
          <CardDescription>
            {__rich(
              "Embed this script on {0} to automatically track referral visits and conversions",
              [<strong>{settings.websiteUrl || __tr("your website")}</strong>],
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 — website URL reminder */}
          {!settings.websiteUrl && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {__rich(
                  "Set your {0} in General Settings above first so the snippet is pre-configured.",
                  [<strong>{__tr("Website URL")}</strong>],
                )}
              </p>
            </div>
          )}

          <Tabs defaultValue="script" className="space-y-4">
            <TabsList>
              <TabsTrigger value="script">
                {__tr("Tracking Script")}
              </TabsTrigger>
              <TabsTrigger value="conversion">
                {__tr("Conversion Tracking")}
              </TabsTrigger>
              <TabsTrigger value="referral">
                {__tr("Referral Links")}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Tracking Script ── */}
            <TabsContent value="script" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">
                    {__rich("1. Add this script before {0} on every page", [
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        &lt;/body&gt;
                      </code>,
                    ])}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopySnippet(
                        "script",
                        `<script src="${appUrl}/scripts/refferq-tracker.js" data-api-url="${appUrl}"></script>`,
                      )
                    }
                  >
                    {copiedSnippet === "script" ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-600" />
                        {__tr("Copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        {__tr("Copy")}
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
                  <span className="text-blue-600">&lt;script</span>{" "}
                  <span className="text-purple-600">src</span>=
                  <span className="text-green-600">
                    &quot;{appUrl}/scripts/refferq-tracker.js&quot;
                  </span>
                  <br />
                  {"  "}
                  <span className="text-purple-600">data-api-url</span>=
                  <span className="text-green-600">&quot;{appUrl}&quot;</span>
                  <span className="text-blue-600">&gt;&lt;/script&gt;</span>
                </div>
              </div>

              <Separator />

              <div className="rounded-md border p-4 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {__tr("How it works")}
                </h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>
                    {__rich(
                      "A visitor arrives on {0} via a referral link (e.g. {1})",
                      [
                        <strong>
                          {settings.websiteUrl || __tr("your site")}
                        </strong>,
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                          ?ref=CODE
                        </code>,
                      ],
                    )}
                  </li>
                  <li>
                    {__rich(
                      "The script automatically detects the {0} parameter and stores a 30-day cookie",
                      [
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                          ref
                        </code>,
                      ],
                    )}
                  </li>
                  <li>
                    {__tr(
                      "When the visitor converts (signup, purchase, etc.), you call",
                    )}{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                      Refferq.trackConversion()
                    </code>
                  </li>
                  <li>
                    {__tr(
                      "The referral and commission are recorded in your dashboard automatically",
                    )}
                  </li>
                </ol>
              </div>
            </TabsContent>

            {/* ── Tab: Conversion Tracking ── */}
            <TabsContent value="conversion" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">
                    {__tr(
                      "Call this when a visitor completes a conversion event",
                    )}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopySnippet(
                        "conversion",
                        `// ${__tr("Track a conversion (e.g. after signup or purchase)")}\nRefferq.trackConversion({\n  email: customer.email,\n  name: customer.name,\n  amount: 4999,        // ${__tr("amount in smallest unit (e.g. paise / cents)")}\n  currency: '${settings.currency || "INR"}',\n  orderId: 'ORD-12345' // ${__tr("optional")}\n});`,
                      )
                    }
                  >
                    {copiedSnippet === "conversion" ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-600" />
                        {__tr("Copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        {__tr("Copy")}
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto whitespace-pre">
                  {`// ${__tr("Track a conversion (e.g. after signup or purchase)")}
Refferq.trackConversion({
  email: customer.email,
  name: customer.name,
  amount: 4999,        // ${__tr("amount in smallest unit (e.g. paise / cents)")}
  currency: '${settings.currency || "INR"}',
  orderId: 'ORD-12345' // ${__tr("optional")}
});`}
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">
                    {__tr("Other helpers")}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopySnippet(
                        "helpers",
                        `// ${__tr("Get the current referral code (or null)")}\nconst code = Refferq.getReferralCode();\n\n// ${__tr("Clear the stored referral code")}\nRefferq.clearReferralCode();`,
                      )
                    }
                  >
                    {copiedSnippet === "helpers" ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-600" />
                        {__tr("Copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        {__tr("Copy")}
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto whitespace-pre">
                  {`// ${__tr("Get the current referral code (or null)")}
const code = Refferq.getReferralCode();

// ${__tr("Clear the stored referral code")}
Refferq.clearReferralCode();`}
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Referral Links ── */}
            <TabsContent value="referral" className="space-y-4">
              <div className="rounded-md border p-4 space-y-3">
                <h4 className="text-sm font-medium">
                  {__tr("Referral link format")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {__rich(
                    "Affiliates share links to your website with a {0} query parameter. The tracking script picks this up automatically.",
                    [
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        ref
                      </code>,
                    ],
                  )}
                </p>
                <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
                  {settings.websiteUrl || "https://yoursite.com"}/
                  <span className="text-blue-600">?ref=</span>
                  <span className="text-green-600">PARTNER-CODE</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {__rich(
                    "The script also recognizes {0} and {1} parameters.",
                    [
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        ?referral=
                      </code>,
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        ?affiliate=
                      </code>,
                    ],
                  )}
                </p>
              </div>

              <div className="rounded-md border p-4 space-y-3">
                <h4 className="text-sm font-medium">
                  {__tr("Direct referral route")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {__tr(
                    "You can also use the built-in redirect route to send visitors through Refferq first:",
                  )}
                </p>
                <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
                  {appUrl}/<span className="text-blue-600">r/</span>
                  <span className="text-green-600">PARTNER-CODE</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
