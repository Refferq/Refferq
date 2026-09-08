"use client";
import { useI18n } from "@/i18n/provider";

import { type Locale } from "@/i18n";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import React, { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { User, Save, CheckCircle2, Shield, Key } from "lucide-react";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function SettingsPage() {
  const {
    locale,
    t: __tr,
    label: __label,
    getIntlLocale: __locale,
    getLanguages,
    refreshLanguage,
  } = useI18n();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState<Locale>(locale);
  useEffect(() => {
    setLanguage(locale);
  }, [locale]);
  const [languageError, setLanguageError] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const applyLanguage = async () => {
    setSavingLanguage(true);
    setLanguageError(false);
    try {
      const response = await fetch("/api/admin/locale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: language }),
      });
      if (!response.ok) throw new Error("Language update failed");
      await refreshLanguage();
      setSavingLanguage(false);
    } catch {
      setLanguageError(true);
      setSavingLanguage(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setName(data.user.name);
        setEmail(data.user.email);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        await fetchProfile();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {__tr("Settings")}
        </h1>
        <p className="text-muted-foreground">
          {__tr("Manage your account and preferences")}
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {__tr("Profile")}
              </CardTitle>
              <CardDescription>
                {__tr("Your personal account information")}
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  {__tr("Saved")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? __tr("Saving...") : __tr("Save")}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">{__tr("Full Name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{__tr("Email Address")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {__tr("Account Details")}
          </CardTitle>
          <CardDescription>
            {__tr("Read-only account information")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{__tr("Role")}</p>
                  <p className="text-sm text-muted-foreground">
                    {__label(profile.role)}
                  </p>
                </div>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{__tr("Status")}</p>
                  <p className="text-sm text-muted-foreground">
                    {__label(profile.status)}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {__tr("Account Created")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.createdAt).toLocaleDateString(
                      __locale(),
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
                <Key className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {__tr("Security")}
          </CardTitle>
          <CardDescription>
            {__tr("Authentication is managed via OTP")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {__tr(
              "This platform uses passwordless OTP-based authentication. A one-time code is sent to your email each time you log in. No password management is required.",
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{__tr("Interface language")}</CardTitle>
          <CardDescription>
            {__tr("Choose the system language for all users.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="interface-language">{__tr("Language")}</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={language}
              onValueChange={(value) => {
                setLanguage(value as Locale);
                setLanguageError(false);
              }}
            >
              <SelectTrigger id="interface-language" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getLanguages().map((item) => (
                  <SelectItem key={item.locale} value={item.locale}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={applyLanguage}
              disabled={savingLanguage || language === locale}
            >
              {__tr("Apply language")}
            </Button>
          </div>
          {languageError && (
            <p role="alert" className="text-sm text-destructive">
              {__tr("Failed to save the system language")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
