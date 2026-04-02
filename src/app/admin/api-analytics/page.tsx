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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  BarChart3,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  TrendingUp,
} from 'lucide-react';

interface DailyBreakdown {
  date: string;
  requests: number;
}

interface TopEndpoint {
  endpoint: string;
  count: number;
  avgResponseMs: number;
}

interface StatusBucket {
  statusCode: number;
  count: number;
}

interface KeyUsage {
  apiKeyId: string;
  keyName: string;
  count: number;
}

interface RecentLog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseMs: number;
  ipAddress: string | null;
  createdAt: string;
  apiKey: { name: string } | null;
}

interface AnalyticsData {
  totalRequests: number;
  avgResponseMs: number;
  errorCount: number;
  errorRate: string;
  dailyBreakdown: DailyBreakdown[];
  topEndpoints: TopEndpoint[];
  statusDistribution: StatusBucket[];
  keyUsage: KeyUsage[];
  recentLogs: RecentLog[];
}

export default function ApiAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      const res = await fetch(`/api/admin/api-usage?${params}`);
      const json = await res.json();
      if (json.success) setData(json.analytics);
    } catch (error) {
      console.error('Failed to fetch API analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const statusColor = (code: number) => {
    if (code < 300) return 'bg-green-500';
    if (code < 400) return 'bg-blue-500';
    if (code < 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const statusBadgeVariant = (code: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (code < 300) return 'default';
    if (code < 400) return 'secondary';
    if (code < 500) return 'outline';
    return 'destructive';
  };

  const methodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-600';
      case 'POST': return 'text-blue-600';
      case 'PUT': return 'text-yellow-600';
      case 'PATCH': return 'text-orange-600';
      case 'DELETE': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Analytics</h1>
          <p className="text-muted-foreground">Monitor API usage and performance</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const maxDailyReqs = data ? Math.max(...data.dailyBreakdown.map((d) => d.requests), 1) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Analytics</h1>
          <p className="text-muted-foreground">Monitor API usage and performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalRequests.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">in selected period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(data.avgResponseMs)}ms</div>
                <p className="text-xs text-muted-foreground">average response time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Error Count</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{data.errorCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">4xx/5xx responses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.errorRate}%</div>
                <p className="text-xs text-muted-foreground">of total requests</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Chart (simplified bar chart using divs) */}
          {data.dailyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Daily Requests</CardTitle>
                <CardDescription>Request volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-40">
                  {data.dailyBreakdown.map((day) => {
                    const height = Math.max((day.requests / maxDailyReqs) * 100, 2);
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${day.date}: ${day.requests} requests`}>
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.requests}
                        </span>
                        <div className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary" style={{ height: `${height}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{data.dailyBreakdown[0]?.date}</span>
                  <span>{data.dailyBreakdown[data.dailyBreakdown.length - 1]?.date}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Endpoints</CardTitle>
                <CardDescription>Most called API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topEndpoints.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.topEndpoints.map((ep, idx) => {
                      const pct = data.totalRequests > 0 ? Math.round((ep.count / data.totalRequests) * 100) : 0;
                      return (
                        <div key={ep.endpoint} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-mono text-xs truncate max-w-[200px]" title={ep.endpoint}>{ep.endpoint}</span>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span>{ep.count.toLocaleString()}</span>
                              <span className="text-xs">{Math.round(ep.avgResponseMs)}ms</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
                <CardDescription>Response status code breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {data.statusDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.statusDistribution.map((s) => {
                      const pct = data.totalRequests > 0 ? Math.round((s.count / data.totalRequests) * 100) : 0;
                      return (
                        <div key={s.statusCode} className="flex items-center gap-3">
                          <Badge variant={statusBadgeVariant(s.statusCode)} className="w-14 justify-center">{s.statusCode}</Badge>
                          <div className="flex-1">
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${statusColor(s.statusCode)}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">{s.count.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Per-Key Usage */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Usage by API Key</CardTitle>
                <CardDescription>Request distribution across API keys</CardDescription>
              </CardHeader>
              <CardContent>
                {data.keyUsage.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key Name</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.keyUsage.map((k) => {
                        const pct = data.totalRequests > 0 ? ((k.count / data.totalRequests) * 100).toFixed(1) : '0';
                        return (
                          <TableRow key={k.apiKeyId}>
                            <TableCell className="font-medium">{k.keyName}</TableCell>
                            <TableCell className="text-right">{k.count.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{pct}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Recent API Calls</CardTitle>
              <CardDescription>Latest 100 API requests</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No API calls yet</h3>
                  <p className="text-sm text-muted-foreground">API requests will appear here once keys are in use</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Response</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <span className={`font-mono text-xs font-bold ${methodColor(log.method)}`}>{log.method}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs truncate max-w-[200px] block" title={log.endpoint}>{log.endpoint}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant(log.statusCode)} className="text-xs">{log.statusCode}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">{log.responseMs}ms</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.apiKey?.name || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', day: 'numeric', month: 'short' })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
