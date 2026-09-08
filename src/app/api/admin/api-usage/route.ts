import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function verifyAdmin(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') return null;
    return user;
  } catch (_e) {
    return null;
  }
}

 async function GETHandler(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: __tr("Unauthorized") }, { status: 401 });

  try {
    const url = new URL(request.url);
    const apiKeyId = url.searchParams.get('apiKeyId');
    const period = url.searchParams.get('period') || '7d'; // 1d, 7d, 30d, 90d
    const endpoint = url.searchParams.get('endpoint');

    // Calculate date range
    const now = new Date();
    const daysMap: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      createdAt: { gte: startDate },
    };
    if (apiKeyId) where.apiKeyId = apiKeyId;
    if (endpoint) where.endpoint = { contains: endpoint };

    // Aggregate stats
    const [totalRequests, avgResponseTime, errorCount, logs, topEndpoints] = await Promise.all([
      // Total requests
      prisma.apiUsageLog.count({ where }),

      // Average response time
      prisma.apiUsageLog.aggregate({
        where,
        _avg: { responseMs: true },
      }),

      // Error count (4xx & 5xx)
      prisma.apiUsageLog.count({
        where: { ...where, statusCode: { gte: 400 } },
      }),

      // Recent logs
      prisma.apiUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          apiKey: {
            select: { name: true, prefix: true },
          },
        },
      }),

      // Top endpoints by request count (raw query via groupBy)
      prisma.apiUsageLog.groupBy({
        by: ['endpoint'],
        where,
        _count: { endpoint: true },
        _avg: { responseMs: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10,
      }),
    ]);

    // Daily usage breakdown
    const dailyUsage = await prisma.apiUsageLog.groupBy({
      by: ['createdAt'],
      where,
      _count: true,
    });

    // Aggregate daily counts by date string
    const dailyMap = new Map<string, number>();
    for (const entry of dailyUsage) {
      const dateStr = new Date(entry.createdAt).toISOString().slice(0, 10);
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + entry._count);
    }

    // Build daily array covering the range
    const dailyBreakdown: { date: string; requests: number }[] = [];
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      dailyBreakdown.push({
        date: dateStr,
        requests: dailyMap.get(dateStr) || 0,
      });
    }

    // Status code distribution
    const statusDistribution = await prisma.apiUsageLog.groupBy({
      by: ['statusCode'],
      where,
      _count: true,
      orderBy: { _count: { statusCode: 'desc' } },
    });

    // Per-key usage
    const keyUsage = await prisma.apiUsageLog.groupBy({
      by: ['apiKeyId'],
      where,
      _count: true,
      _avg: { responseMs: true },
      orderBy: { _count: { apiKeyId: 'desc' } },
      take: 10,
    });

    // Enrich key usage with key names
    const keyIds = keyUsage.map((k) => k.apiKeyId);
    const keys = await prisma.apiKey.findMany({
      where: { id: { in: keyIds } },
      select: { id: true, name: true, prefix: true },
    });
    const keyMap = new Map(keys.map((k) => [k.id, k]));

    return NextResponse.json({
      success: true,
      analytics: {
        period,
        totalRequests,
        avgResponseMs: Math.round(avgResponseTime._avg.responseMs || 0),
        errorCount,
        errorRate: totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : '0',
        dailyBreakdown,
        topEndpoints: topEndpoints.map((e) => ({
          endpoint: e.endpoint,
          requests: e._count.endpoint,
          avgResponseMs: Math.round(e._avg.responseMs || 0),
        })),
        statusDistribution: statusDistribution.map((s) => ({
          statusCode: s.statusCode,
          count: s._count,
        })),
        keyUsage: keyUsage.map((k) => ({
          apiKeyId: k.apiKeyId,
          name: keyMap.get(k.apiKeyId)?.name || __tr("Unknown"),
          prefix: keyMap.get(k.apiKeyId)?.prefix || '',
          requests: k._count,
          avgResponseMs: Math.round(k._avg.responseMs || 0),
        })),
        recentLogs: logs.map((l) => ({
          id: l.id,
          endpoint: l.endpoint,
          method: l.method,
          statusCode: l.statusCode,
          responseMs: l.responseMs,
          ipAddress: l.ipAddress,
          keyName: l.apiKey.name,
          keyPrefix: l.apiKey.prefix,
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('API usage analytics error:', error);
    return NextResponse.json({ error: __tr("Failed to fetch API usage analytics") }, { status: 500 });
  }
}

export const GET = withSystemLocale(GETHandler);
