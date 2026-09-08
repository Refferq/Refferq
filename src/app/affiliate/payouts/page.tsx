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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  Ban,
  Wallet,
  CreditCard,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  paidAt?: string;
}

export default function PayoutsPage() {
  const {
    getIntlLocale: __locale,
    label: __label,
    t: __tr,
    plural: __plural,
  } = useI18n();

  const { user, loading: authLoading } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  useEffect(() => {
    if (!authLoading && user) fetchPayouts();
  }, [authLoading, user]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const [payRes, profileRes] = await Promise.all([
        fetch("/api/affiliate/payouts"),
        fetch("/api/affiliate/profile"),
      ]);
      const payData = await payRes.json();
      const profileData = await profileRes.json();
      if (payData.success) setPayouts(payData.payouts || []);
      if (profileData.success) {
        setBalance(profileData.affiliate?.balanceCents || 0);
        setCurrencySymbol(profileData.currencySymbol || "₹");
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(__locale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatCurrency = (cents: number) =>
    `${currencySymbol}${(cents / 100).toLocaleString(__locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadge = (status: string) => {
    const map: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ElementType;
      }
    > = {
      COMPLETED: { variant: "default", icon: CheckCircle2 },
      PAID: { variant: "default", icon: CheckCircle2 },
      PENDING: { variant: "secondary", icon: Clock },
      PROCESSING: { variant: "secondary", icon: Loader2 },
      FAILED: { variant: "destructive", icon: Ban },
    };
    const { variant, icon: Icon } = map[status] || {
      variant: "outline" as const,
      icon: Clock,
    };
    return (
      <Badge variant={variant} className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {__label(status)}
      </Badge>
    );
  };

  const totalPaid = payouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayout = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const exportCSV = () => {
    const headers = [
      __tr("Date"),
      __tr("Method"),
      __tr("Status"),
      __tr("Amount"),
    ];
    const rows = payouts.map((p) => [
      formatDate(p.paidAt || p.createdAt),
      __label(p.method),
      __label(p.status),
      (p.amount / 100).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
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
            {__tr("Payouts")}
          </h1>
          <p className="text-muted-foreground">
            {__tr("Track your earnings and payout history")}
          </p>
        </div>
        {payouts.length > 0 && (
          <Button variant="outline" onClick={exportCSV} className="gap-1.5">
            <Download className="h-4 w-4" />
            {__tr("Export")}
          </Button>
        )}
      </div>

      {/* Earnings Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <span className="text-sm font-bold text-emerald-600">
                  {currencySymbol}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
                <p className="text-xs text-muted-foreground">
                  {__tr("Current Balance")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {__tr("Total Paid")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(pendingPayout)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {__tr("Pending")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <CreditCard className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{payouts.length}</p>
                <p className="text-xs text-muted-foreground">
                  {__tr("Total Payouts")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {__tr("Payout Schedule")}
            </p>
            <p className="text-sm text-blue-700">
              {__tr(
                "Payouts are processed on the 1st of each month for the previous month&apos;s earnings. Minimum payout threshold is",
              )}{" "}
              {currencySymbol}1,000.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{__tr("Payout History")}</CardTitle>
          <CardDescription>
            {__plural(payouts.length, "payout")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium">{__tr("No payouts yet")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {__tr("Start referring customers to earn commissions")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{__tr("Date")}</TableHead>
                  <TableHead>{__tr("Method")}</TableHead>
                  <TableHead>{__tr("Status")}</TableHead>
                  <TableHead className="text-right">{__tr("Amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="text-sm">
                      {formatDate(payout.paidAt || payout.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {__label(payout.method) || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payout.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
