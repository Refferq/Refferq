"use client";
import { useI18n } from "@/i18n/provider";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Building2,
  Mail,
  Globe,
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Key,
  Copy,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const { t: __tr } = useI18n();

  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [saving, setSaving] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    name: "",
    company: "",
    email: "",
    country: __tr("India"),
    paymentMethod: __tr("PayPal"),
    paymentEmail: "",
  });

  useEffect(() => {
    if (!authLoading && user) loadProfile();
  }, [authLoading, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/affiliate/profile");
      const data = await res.json();
      if (data.success) {
        const pd = data.affiliate?.payoutDetails || {};
        setReferralCode(data.affiliate?.referralCode || "");
        setSettingsForm({
          name: data.user?.name || user?.name || "",
          company: pd.company || "",
          email: data.user?.email || user?.email || "",
          country: pd.country || __tr("India"),
          paymentMethod: pd.paymentMethod || __tr("PayPal"),
          paymentEmail: pd.paymentEmail || data.user?.email || "",
        });
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/affiliate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        showNotification("success", __tr("Settings updated successfully!"));
      } else {
        const data = await res.json();
        showNotification(
          "error",
          data.error || __tr("Failed to update settings"),
        );
      }
    } catch (_e) {
      showNotification("error", __tr("An error occurred"));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const res = await fetch("/api/affiliate/generate-code", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", __tr("Referral code generated!"));
        loadProfile();
      } else {
        showNotification(
          "error",
          __tr("Failed to generate code:") + data.error,
        );
      }
    } catch (_e) {
      showNotification("error", __tr("Failed to generate code"));
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {notification && (
        <Alert
          variant={notification.type === "error" ? "destructive" : "default"}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {__tr("Settings")}
        </h1>
        <p className="text-muted-foreground">
          {__tr("Manage your account and payment preferences")}
        </p>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            {__tr("Referral Code")}
          </CardTitle>
          <CardDescription>
            {__tr("Your unique referral identifier")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referralCode ? (
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={referralCode}
                className="font-mono max-w-xs"
              />
              <Button variant="outline" size="icon" onClick={copyCode}>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {__tr("No referral code generated yet.")}
              </p>
              <Button onClick={handleGenerateCode}>
                {__tr("Generate Code")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            {__tr("Personal Details")}
          </CardTitle>
          <CardDescription>
            {__tr("Manage your account information")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> {__tr("Full Name")}
              </Label>
              <Input
                id="name"
                value={settingsForm.name}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, name: e.target.value })
                }
                placeholder={__tr("John Doe")}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> {__tr("Company")}
              </Label>
              <Input
                value={settingsForm.company}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, company: e.target.value })
                }
                placeholder={__tr("Company Name")}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {__tr("Email")}
              </Label>
              <Input
                type="email"
                value={settingsForm.email}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> {__tr("Country")}
              </Label>
              <Select
                value={settingsForm.country}
                onValueChange={(v) =>
                  setSettingsForm({ ...settingsForm, country: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="India">{__tr("India")}</SelectItem>
                  <SelectItem value="USA">{__tr("United States")}</SelectItem>
                  <SelectItem value="UK">{__tr("United Kingdom")}</SelectItem>
                  <SelectItem value="Canada">{__tr("Canada")}</SelectItem>
                  <SelectItem value="Australia">{__tr("Australia")}</SelectItem>
                  <SelectItem value="Germany">{__tr("Germany")}</SelectItem>
                  <SelectItem value="France">{__tr("France")}</SelectItem>
                  <SelectItem value="Singapore">{__tr("Singapore")}</SelectItem>
                  <SelectItem value="UAE">{__tr("UAE")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            {__tr("Payment Details")}
          </CardTitle>
          <CardDescription>
            {__tr("Configure how you receive payouts")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{__tr("Payment Method")}</Label>
              <Select
                value={settingsForm.paymentMethod}
                onValueChange={(v) =>
                  setSettingsForm({ ...settingsForm, paymentMethod: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PayPal">{__tr("PayPal")}</SelectItem>
                  <SelectItem value="Bank Transfer">
                    {__tr("Bank Transfer")}
                  </SelectItem>
                  <SelectItem value="Stripe">{__tr("Stripe")}</SelectItem>
                  <SelectItem value="Wise">{__tr("Wise")}</SelectItem>
                  <SelectItem value="Wire Transfer">
                    {__tr("Wire Transfer")}
                  </SelectItem>
                  <SelectItem value="UPI">{__tr("UPI")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{__tr("Payment Email / Account")}</Label>
              <Input
                value={settingsForm.paymentEmail}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    paymentEmail: e.target.value,
                  })
                }
                placeholder="payment@example.com"
              />
            </div>
          </div>

          <Separator />

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {__tr(
                "Your payment information is encrypted and stored securely. We will never share your details with third parties.",
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? __tr("Saving...") : __tr("Save Changes")}
        </Button>
      </div>
    </div>
  );
}
