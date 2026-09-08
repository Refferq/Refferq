"use client";
import { useI18n } from "@/i18n/provider";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Users,
  Wallet,
  IndianRupee,
  CreditCard,
  Copy,
  ExternalLink,
  Loader2,
  MousePointerClick,
  Target,
  TrendingUp,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
} from "lucide-react";

interface Partner {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  partnerGroup?: string;
  commissionRate: number;
  status: string;
  totalClicks: number;
  totalLeads: number;
  totalRevenue: number;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  status: string;
  totalPaid: number;
  createdAt: string;
}

interface Commission {
  id: string;
  transactionId: string;
  customerName: string;
  amountCents: number;
  rate: number;
  status: "PENDING" | "PAID" | "COMPLETED" | "REFUNDED";
  createdAt: string;
  paidAt?: string;
}

interface Payout {
  id: string;
  amountCents: number;
  commissionCount: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  method?: string;
  createdAt: string;
  processedAt?: string;
}

export default function PartnerDetailPage() {
  const {
    t: __tr,
    getIntlLocale: __locale,
    label: __label,
    plural: __plural,
    rich: __rich,
  } = useI18n();

  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const partnerId = params.id as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingPayout, setEditingPayout] = useState<Payout | null>(null);
  const [newStatus, setNewStatus] = useState<
    "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  >("PENDING");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
      return;
    }
    if (user && partnerId) {
      fetchPartnerData();
      fetchCustomers();
      fetchCommissions();
      fetchPayouts();
    }
  }, [authLoading, user, partnerId]);

  const fetchPartnerData = async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) {
        const data = await res.json();
        const affiliate = data.affiliates?.find((a: any) => a.id === partnerId);
        if (affiliate) {
          setPartner({
            id: affiliate.id,
            name: affiliate.name,
            email: affiliate.email,
            referralCode: affiliate.referralCode,
            partnerGroup: affiliate.partnerGroup,
            commissionRate: affiliate.commissionRate || 0.2,
            status: affiliate.status,
            totalClicks: affiliate.totalClicks || 0,
            totalLeads: affiliate.totalLeads || 0,
            totalRevenue: affiliate.totalRevenue || 0,
            createdAt: affiliate.createdAt,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching partner:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/admin/referrals");
      if (res.ok) {
        const data = await res.json();
        const partnerCustomers =
          data.referrals
            ?.filter((r: any) => r.affiliateId === partnerId)
            .map((r: any) => ({
              id: r.id,
              name: r.leadName,
              email: r.leadEmail,
              status: r.status,
              totalPaid: r.estimatedValue || 0,
              createdAt: r.createdAt,
            })) || [];
        setCustomers(partnerCustomers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchCommissions = async () => {
    try {
      const res = await fetch(
        `/api/admin/transactions?affiliateId=${partnerId}`,
      );
      if (res.ok) {
        const data = await res.json();
        const comms =
          data.transactions?.map((txn: any) => ({
            id: txn.id,
            transactionId: txn.id,
            customerName: txn.customerName,
            amountCents: txn.commissionCents,
            rate: txn.commissionRate,
            status: txn.status === "COMPLETED" ? "PENDING" : txn.status,
            createdAt: txn.createdAt,
            paidAt: txn.paidAt,
          })) || [];
        setCommissions(comms);
      }
    } catch (error) {
      console.error("Error fetching commissions:", error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const res = await fetch(`/api/admin/payouts?affiliateId=${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
    }
  };

  const handleCreatePayout = async () => {
    if (selectedCommissions.length === 0) {
      alert(__tr("Please select at least one commission to create a payout"));
      return;
    }
    setPayoutLoading(true);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: partnerId,
          commissionIds: selectedCommissions,
        }),
      });
      if (res.ok) {
        alert(__tr("Payout created successfully!"));
        setShowPayoutModal(false);
        setSelectedCommissions([]);
        fetchCommissions();
        fetchPayouts();
      } else {
        const error = await res.json();
        alert(
          __tr("Error: {0}", [error.error || __tr("Failed to create payout")]),
        );
      }
    } catch (error) {
      console.error("Error creating payout:", error);
      alert(__tr("Failed to create payout"));
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleUpdatePayoutStatus = async () => {
    if (!editingPayout) return;
    setPayoutLoading(true);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingPayout.id, status: newStatus }),
      });
      if (res.ok) {
        alert(__tr("Payout status updated successfully!"));
        setShowStatusModal(false);
        setEditingPayout(null);
        fetchPayouts();
      } else {
        const error = await res.json();
        alert(
          __tr("Error: {0}", [
            error.error || __tr("Failed to update payout status"),
          ]),
        );
      }
    } catch (error) {
      console.error("Error updating payout status:", error);
      alert(__tr("Failed to update payout status"));
    } finally {
      setPayoutLoading(false);
    }
  };

  const openStatusModal = (payout: Payout) => {
    setEditingPayout(payout);
    setNewStatus(payout.status);
    setShowStatusModal(true);
  };

  const toggleCommissionSelection = (commissionId: string) => {
    setSelectedCommissions((prev) =>
      prev.includes(commissionId)
        ? prev.filter((id) => id !== commissionId)
        : [...prev, commissionId],
    );
  };

  const formatCurrency = (cents: number) =>
    `\u20B9${(cents / 100).toLocaleString(__locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(__locale(), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const pendingCommissions = commissions.filter((c) => c.status === "PENDING");
  const pendingAmount = pendingCommissions.reduce(
    (sum, c) => sum + c.amountCents,
    0,
  );
  const paidCommissions = commissions.filter((c) => c.status === "PAID");
  const paidAmount = paidCommissions.reduce((sum, c) => sum + c.amountCents, 0);

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
      ACTIVE: { variant: "default", icon: CheckCircle2 },
      APPROVED: { variant: "default", icon: CheckCircle2 },
      PENDING: { variant: "secondary", icon: Clock },
      PROCESSING: { variant: "secondary", icon: Loader2 },
      FAILED: { variant: "destructive", icon: AlertCircle },
      REFUNDED: { variant: "destructive", icon: Ban },
      REJECTED: { variant: "destructive", icon: Ban },
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

  if (authLoading || loading) {
    return <DetailSkeleton />;
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-bold">{__tr("Partner not found")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {__tr("This partner may have been removed")}
        </p>
        <Button className="mt-6" onClick={() => router.push("/admin/partners")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {__tr("Back to Partners")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => router.push("/admin/partners")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {__tr("Partners")}
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {(partner.name || "P").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {partner.name}
              </h1>
              <p className="text-sm text-muted-foreground">{partner.email}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs gap-1">
                  <Copy className="h-3 w-3" />
                  {partner.referralCode}
                </Badge>
                {partner.partnerGroup && (
                  <Badge variant="secondary" className="text-xs">
                    {partner.partnerGroup}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {(partner.commissionRate * 100).toLocaleString(__locale(), {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                  {__tr("% commission")}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setShowPayoutModal(true)}
          disabled={pendingCommissions.length === 0}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {__tr("Create Payout")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-xs text-muted-foreground">
                  {__tr("Customers")}
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
                  {formatCurrency(pendingAmount)}
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(paidAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {__tr("Paid Out")}
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
                <p className="text-2xl font-bold">{payouts.length}</p>
                <p className="text-xs text-muted-foreground">
                  {__tr("Payouts")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{__tr("Overview")}</TabsTrigger>
          <TabsTrigger value="customers">
            {__tr("Customers (")}
            {customers.length})
          </TabsTrigger>
          <TabsTrigger value="commissions">
            {__tr("Commissions (")}
            {commissions.length})
          </TabsTrigger>
          <TabsTrigger value="payouts">
            {__tr("Payouts (")}
            {payouts.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {__tr("Partner Information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: "name", label: __tr("Full Name"), value: partner.name },
                  { id: "email", label: __tr("Email"), value: partner.email },
                  {
                    id: "code",
                    label: __tr("Referral Code"),
                    value: partner.referralCode,
                    mono: true,
                  },
                  {
                    id: "group",
                    label: __tr("Partner Group"),
                    value: partner.partnerGroup || __tr("Default"),
                  },
                  {
                    id: "commission",
                    label: __tr("Commission Rate"),
                    value: `${(partner.commissionRate * 100).toLocaleString(__locale(), { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%`,
                  },
                  {
                    id: "created",
                    label: __tr("Partner Since"),
                    value: formatDate(partner.createdAt),
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span
                      className={`text-sm font-medium ${item.mono ? "font-mono" : ""}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {__tr("Performance")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-muted">
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-xl font-bold">
                      {partner.totalClicks}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {__tr("Clicks")}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-muted">
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-xl font-bold">
                      {partner.totalLeads}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {__tr("Leads")}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-muted">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="mt-2 text-xl font-bold text-emerald-600">
                      {formatCurrency(partner.totalRevenue * 100)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {__tr("Revenue")}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {__tr("Total Commissions")}
                    </span>
                    <span className="text-sm font-bold">
                      {commissions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {__tr("Pending Amount")}
                    </span>
                    <span className="text-sm font-bold text-amber-600">
                      {formatCurrency(pendingAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {__tr("Paid Amount")}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(paidAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {__tr("Referred Customers")}
              </CardTitle>
              <CardDescription>
                {__plural(customers.length, "referredCustomers")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {customers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{__tr("Full Name")}</TableHead>
                      <TableHead>{__tr("Email")}</TableHead>
                      <TableHead>{__tr("Status")}</TableHead>
                      <TableHead className="text-right">
                        {__tr("Total Paid")}
                      </TableHead>
                      <TableHead>{__tr("Joined")}</TableHead>
                      <TableHead className="w-20">{__tr("Action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {customer.email}
                        </TableCell>
                        <TableCell>{getStatusBadge(customer.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(customer.totalPaid * 100)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(customer.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/customers/${customer.id}`)
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {__tr("No customers yet")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {__tr("Commission History")}
                </CardTitle>
                <CardDescription>
                  {__rich("Pending: {0} · Paid: {1}", [
                    formatCurrency(pendingAmount),
                    formatCurrency(paidAmount),
                  ])}
                </CardDescription>
              </div>
              {pendingCommissions.length > 0 && (
                <Button size="sm" onClick={() => setShowPayoutModal(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {__tr("Create Payout")}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {commissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{__tr("Date")}</TableHead>
                      <TableHead>{__tr("Customer")}</TableHead>
                      <TableHead className="text-right">
                        {__tr("Amount")}
                      </TableHead>
                      <TableHead className="text-right">
                        {__tr("Rate")}
                      </TableHead>
                      <TableHead>{__tr("Status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(comm.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {comm.customerName}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(comm.amountCents)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {(comm.rate * 100).toLocaleString(__locale(), {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                          %
                        </TableCell>
                        <TableCell>{getStatusBadge(comm.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IndianRupee className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {__tr("No commissions yet")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {__tr("Payout History")}
                </CardTitle>
                <CardDescription>
                  {__plural(payouts.length, "payout")}
                </CardDescription>
              </div>
              {pendingCommissions.length > 0 && (
                <Button size="sm" onClick={() => setShowPayoutModal(true)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {__tr("Create Payout")}
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{__tr("Date")}</TableHead>
                      <TableHead className="text-right">
                        {__tr("Amount")}
                      </TableHead>
                      <TableHead className="text-right">
                        {__tr("Commissions")}
                      </TableHead>
                      <TableHead>{__tr("Status")}</TableHead>
                      <TableHead>{__tr("Method")}</TableHead>
                      <TableHead>{__tr("Processed")}</TableHead>
                      <TableHead className="w-24">{__tr("Action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(payout.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatCurrency(payout.amountCents)}
                        </TableCell>
                        <TableCell className="text-right">
                          {payout.commissionCount}
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {payout.method || "\u2014"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {payout.processedAt
                            ? formatDate(payout.processedAt)
                            : "\u2014"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openStatusModal(payout)}
                          >
                            {__tr("Update")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wallet className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {__tr("No payouts yet")}
                  </p>
                  {pendingCommissions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowPayoutModal(true)}
                    >
                      {__tr("Create First Payout")}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Payout Dialog */}
      <Dialog
        open={showPayoutModal}
        onOpenChange={(open) => {
          setShowPayoutModal(open);
          if (!open) setSelectedCommissions([]);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{__tr("Create Payout")}</DialogTitle>
            <DialogDescription>
              {__tr("Select commissions to include in this payout")}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              {__tr("Selected total")}
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(
                selectedCommissions.reduce((sum, id) => {
                  const comm = pendingCommissions.find((c) => c.id === id);
                  return sum + (comm?.amountCents || 0);
                }, 0),
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {__rich("{0} of {1} commissions", [
                selectedCommissions.length,
                pendingCommissions.length,
              ])}
            </p>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {pendingCommissions.map((comm) => (
              <div
                key={comm.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                  selectedCommissions.includes(comm.id)
                    ? "border-primary/50 bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => toggleCommissionSelection(comm.id)}
              >
                <Checkbox
                  checked={selectedCommissions.includes(comm.id)}
                  onCheckedChange={() => toggleCommissionSelection(comm.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {comm.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(comm.createdAt)} ·{" "}
                    {(comm.rate * 100).toLocaleString(__locale(), {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                    %
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary shrink-0">
                  {formatCurrency(comm.amountCents)}
                </span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPayoutModal(false);
                setSelectedCommissions([]);
              }}
            >
              {__tr("Cancel")}
            </Button>
            <Button
              onClick={handleCreatePayout}
              disabled={payoutLoading || selectedCommissions.length === 0}
            >
              {payoutLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {__tr("Create Payout (")}
              {selectedCommissions.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={showStatusModal}
        onOpenChange={(open) => {
          setShowStatusModal(open);
          if (!open) setEditingPayout(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{__tr("Update Payout Status")}</DialogTitle>
            <DialogDescription>
              {__tr("Change the processing status of this payout")}
            </DialogDescription>
          </DialogHeader>

          {editingPayout && (
            <>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  {__tr("Payout Amount")}
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(editingPayout.amountCents)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {editingPayout.commissionCount}{" "}
                  {__tr("commissions · Created")}{" "}
                  {formatDate(editingPayout.createdAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{__tr("New Status")}</Label>
                <Select
                  value={newStatus}
                  onValueChange={(v) => setNewStatus(v as typeof newStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">
                      {__tr("Pending \\u2014 Awaiting processing")}
                    </SelectItem>
                    <SelectItem value="PROCESSING">
                      {__tr("Processing \\u2014 Payment in progress")}
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      {__tr("Completed \\u2014 Payment successful")}
                    </SelectItem>
                    <SelectItem value="FAILED">
                      {__tr("Failed \\u2014 Payment failed")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newStatus === "COMPLETED" &&
                    __tr("Affiliate will be notified of payment completion")}
                  {newStatus === "PROCESSING" &&
                    __tr("Payout is being processed")}
                  {newStatus === "FAILED" &&
                    __tr("Payment failed, may need manual intervention")}
                  {newStatus === "PENDING" &&
                    __tr("Payout is waiting to be processed")}
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setEditingPayout(null);
              }}
            >
              {__tr("Cancel")}
            </Button>
            <Button onClick={handleUpdatePayoutStatus} disabled={payoutLoading}>
              {payoutLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {__tr("Update Status")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-7 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-96" />
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
