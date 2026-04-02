'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  IndianRupee,
  Users,
  Target,
  Clock,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  Wallet,
  UserCheck,
  CreditCard,
  Activity,
  Eye,
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalEstimatedRevenue: number;
  totalEstimatedCommission: number;
  totalClicks: number;
  totalLeads: number;
  totalReferredCustomers: number;
  totalAffiliates: number;
  pendingReferrals: number;
}

interface TopAffiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  totalRevenue: number;
  totalReferrals: number;
}

interface RecentCustomer {
  id: string;
  leadName: string;
  leadEmail: string;
  affiliateName: string;
  amountPaid: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes, referralsRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/analytics?days=30'),
        fetch('/api/admin/referrals'),
      ]);

      const [statsData, analyticsData, referralsData] = await Promise.all([
        statsRes.json(),
        analyticsRes.json(),
        referralsRes.json(),
      ]);

      if (statsData.success) {
        setStats({
          totalRevenue: statsData.stats.totalRevenue || 0,
          totalEstimatedRevenue: statsData.stats.totalEstimatedRevenue || 0,
          totalEstimatedCommission: statsData.stats.totalEstimatedCommission || 0,
          totalClicks: 0,
          totalLeads: statsData.stats.totalReferrals || 0,
          totalReferredCustomers: statsData.stats.approvedReferrals || 0,
          totalAffiliates: statsData.stats.totalAffiliates || 0,
          pendingReferrals: statsData.stats.pendingReferrals || 0,
        });
      }

      if (analyticsData.success && analyticsData.analytics.topAffiliates) {
        setTopAffiliates(analyticsData.analytics.topAffiliates.slice(0, 5));
      }

      if (referralsData.success) {
        const recent = referralsData.referrals.slice(0, 10).map((ref: any) => ({
          id: ref.id,
          leadName: ref.leadName,
          leadEmail: ref.leadEmail,
          affiliateName: ref.affiliate.name,
          amountPaid: 0,
          status: ref.status,
          createdAt: ref.createdAt,
        }));
        setRecentCustomers(recent);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const statCards = [
    {
      title: 'Estimated Revenue',
      value: `₽${stats ? (stats.totalEstimatedRevenue / 100).toFixed(2) : '0.00'}`,
      icon: IndianRupee,
      description: 'Total projected value',
      trend: '+12%',
      trendUp: true,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Confirmed Revenue',
      value: `₽${stats ? (stats.totalRevenue / 100).toFixed(2) : '0.00'}`,
      icon: TrendingUp,
      description: 'Approved transactions',
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Commission Owed',
      value: `₽${stats ? (stats.totalEstimatedCommission / 100).toFixed(2) : '0.00'}`,
      icon: Wallet,
      description: 'Pending payouts',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Total Partners',
      value: stats?.totalAffiliates || 0,
      icon: Users,
      description: 'Active affiliates',
      trend: '+5',
      trendUp: true,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
  ];

  const conversionRate = stats && stats.totalLeads > 0
    ? ((stats.totalReferredCustomers / stats.totalLeads) * 100).toFixed(1)
    : '0.0';

  const quickActions = [
    {
      title: 'Partners',
      description: 'Manage affiliates',
      icon: Users,
      href: '/admin/partners',
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Customers',
      description: 'View referrals',
      icon: UserCheck,
      href: '/admin/customers',
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Payouts',
      description: 'Process payments',
      icon: CreditCard,
      href: '/admin/payouts',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Reports',
      description: 'Analytics & insights',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your affiliate program performance
          </p>
        </div>

        {/* Primary Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{stat.description}</span>
                  {stat.trend && (
                    <Badge variant="secondary" className="h-5 gap-0.5 px-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-0">
                      <ArrowUpRight className="h-3 w-3" />
                      {stat.trend}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Overview Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stats?.pendingReferrals || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending Leads</p>
                </div>
                {(stats?.pendingReferrals || 0) > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/customers')}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Review pending</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stats?.totalLeads || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Target className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{stats?.totalReferredCustomers || 0}</p>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground">Rate</p>
                  <p className="text-sm font-bold text-emerald-600">{conversionRate}%</p>
                </div>
              </div>
              <Progress
                value={parseFloat(conversionRate)}
                className="mt-3 h-1.5 [&>div]:bg-emerald-500"
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
              onClick={() => router.push(action.href)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.bg}`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Partners */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Top Partners</CardTitle>
                <CardDescription>Best performing affiliates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/admin/partners')}>
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {topAffiliates.length > 0 ? (
                <div className="space-y-1">
                  {topAffiliates.map((affiliate: any, index: number) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/admin/partners/${affiliate.id}`)}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {affiliate.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{affiliate.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{affiliate.referralCode}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">₽{(affiliate.totalRevenue / 100).toFixed(2)}</p>
                        <p className="text-[11px] text-muted-foreground">{affiliate.totalReferrals} referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No partners yet"
                  description="Partners will appear here once they join"
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Recent Customers</CardTitle>
                <CardDescription>Latest referred customers</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/admin/customers')}>
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {recentCustomers.length > 0 ? (
                <div className="space-y-1">
                  {recentCustomers.slice(0, 5).map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50"
                    >
                      <p className="text-[11px] text-muted-foreground w-12 shrink-0 text-center">
                        {new Date(customer.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{customer.leadEmail}</p>
                        <p className="text-xs text-muted-foreground">via {customer.affiliateName}</p>
                      </div>
                      <StatusBadge status={customer.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={UserCheck}
                  title="No customers yet"
                  description="Referred customers will appear here"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    APPROVED: { variant: 'default', label: 'Approved' },
    PENDING: { variant: 'secondary', label: 'Pending' },
    REJECTED: { variant: 'destructive', label: 'Rejected' },
  };
  const { variant, label } = config[status] || { variant: 'secondary' as const, label: status };

  return (
    <Badge variant={variant} className="text-[10px] font-medium px-2 py-0.5">
      {label}
    </Badge>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-36 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-32 mt-2" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
