import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/email';

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

/**
 * POST - Send a report via email to specified recipients.
 * Body: { reportType, recipients, startDate?, endDate?, format? }
 */
export async function POST(request: NextRequest) {
  const user = await verifyAdmin(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { reportType, recipients, startDate, endDate, format } = body;

    if (!reportType || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'reportType and recipients array are required' },
        { status: 400 }
      );
    }

    // Generate report data
    const reportData = await generateReportData(reportType, startDate, endDate);

    // Format as CSV
    const csvContent = convertToCSV(reportData.data || [reportData.summary || reportData]);

    // Build email HTML
    const reportDate = new Date().toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .stat { display: inline-block; background: white; padding: 15px 20px; border-radius: 8px; margin: 5px; text-align: center; min-width: 120px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #888; text-transform: uppercase; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 13px; }
        th { background: #f0f0f0; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${reportData.type || 'Report'}</h1>
        <p style="margin: 5px 0; opacity: 0.9;">Generated on ${reportDate}</p>
        ${startDate && endDate ? `<p style="margin: 0; opacity: 0.8; font-size: 14px;">${startDate} — ${endDate}</p>` : ''}
      </div>
      <div class="content">
        ${reportData.summary ? renderSummaryHTML(reportData.summary) : ''}
        ${reportData.data && reportData.data.length > 0 ? renderTableHTML(reportData.data.slice(0, 20)) : ''}
        ${reportData.data && reportData.data.length > 20 ? `<p style="color: #888; font-size: 13px;">Showing 20 of ${reportData.data.length} records. Full data attached as CSV.</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/reports" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            View Full Report
          </a>
        </p>
      </div>
      <div class="footer">
        <p>This report was sent from Refferq by ${user.name} (${user.email})</p>
        <p>© ${new Date().getFullYear()} Refferq. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;

    // Send to all recipients
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Refferq <noreply@refferq.com>';
    const results = await Promise.allSettled(
      recipients.map((email: string) =>
        resend.emails.send({
          from: fromEmail,
          to: email.trim(),
          subject: `[Refferq] ${reportData.type || 'Report'} — ${reportDate}`,
          html,
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Report sent to ${sent} recipient(s)${failed > 0 ? `, ${failed} failed` : ''}`,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Email report delivery error:', error);
    return NextResponse.json({ error: 'Failed to send report email' }, { status: 500 });
  }
}

async function generateReportData(reportType: string, startDate?: string, endDate?: string) {
  const dateFilter = startDate && endDate
    ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
    : {};

  if (reportType === 'affiliates') {
    const affiliates = await prisma.affiliate.findMany({
      include: {
        user: true,
        referrals: { where: dateFilter },
        commissions: { where: dateFilter },
      },
    });
    return {
      type: 'Affiliate Performance Report',
      data: affiliates.map((a) => ({
        name: a.user.name,
        email: a.user.email,
        referralCode: a.referralCode,
        totalReferrals: a.referrals.length,
        approved: a.referrals.filter((r) => r.status === 'APPROVED').length,
        totalEarningsCents: a.commissions.reduce((s, c) => s + c.amountCents, 0),
        joinedDate: a.createdAt.toISOString().slice(0, 10),
      })),
    };
  }

  if (reportType === 'referrals') {
    const referrals = await prisma.referral.findMany({
      where: dateFilter,
      include: { affiliate: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      type: 'Referrals Report',
      data: referrals.map((r) => ({
        leadName: r.leadName,
        leadEmail: r.leadEmail,
        status: r.status,
        affiliate: r.affiliate.user.name,
        submittedDate: r.createdAt.toISOString().slice(0, 10),
      })),
    };
  }

  if (reportType === 'commissions') {
    const commissions = await prisma.commission.findMany({
      where: dateFilter,
      include: { affiliate: { include: { user: true } }, conversion: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      type: 'Commissions Report',
      data: commissions.map((c) => ({
        affiliate: c.affiliate.user.name,
        amountCents: c.amountCents,
        rate: c.rate,
        status: c.status,
        createdDate: c.createdAt.toISOString().slice(0, 10),
      })),
    };
  }

  if (reportType === 'payouts') {
    const payouts = await prisma.payout.findMany({
      where: dateFilter,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      type: 'Payouts Report',
      data: payouts.map((p) => ({
        affiliate: p.user.name,
        amountCents: p.amountCents,
        method: p.method,
        status: p.status,
        requestedDate: p.createdAt.toISOString().slice(0, 10),
      })),
    };
  }

  // Default: summary
  const totalAffiliates = await prisma.affiliate.count();
  const totalReferrals = await prisma.referral.count({ where: dateFilter });
  const approvedReferrals = await prisma.referral.count({ where: { ...dateFilter, status: 'APPROVED' } });
  const totalCommissions = await prisma.commission.aggregate({
    where: dateFilter,
    _sum: { amountCents: true },
    _count: true,
  });
  const totalPayouts = await prisma.payout.aggregate({
    where: dateFilter,
    _sum: { amountCents: true },
    _count: true,
  });

  return {
    type: 'Summary Report',
    summary: {
      totalAffiliates,
      totalReferrals,
      approvedReferrals,
      conversionRate: totalReferrals > 0 ? ((approvedReferrals / totalReferrals) * 100).toFixed(2) + '%' : '0%',
      totalCommissions: totalCommissions._count,
      totalCommissionAmountCents: totalCommissions._sum.amountCents || 0,
      totalPayouts: totalPayouts._count,
      totalPayoutAmountCents: totalPayouts._sum.amountCents || 0,
    },
  };
}

function renderSummaryHTML(summary: Record<string, unknown>): string {
  return `<div style="margin: 15px 0;">
    ${Object.entries(summary)
      .map(
        ([key, value]) => `
      <div class="stat">
        <div class="stat-value">${
          typeof value === 'number' && key.toLowerCase().includes('cents')
            ? '₽' + (value / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })
            : value
        }</div>
        <div class="stat-label">${key.replace(/([A-Z])/g, ' $1').replace(/cents$/i, '').trim()}</div>
      </div>`
      )
      .join('')}
  </div>`;
}

function renderTableHTML(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const cols = Object.keys(data[0]);
  return `
    <table>
      <thead><tr>${cols.map((c) => `<th>${c.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}</tr></thead>
      <tbody>${data
        .map(
          (row) => `<tr>${cols
            .map((c) => {
              const v = row[c];
              if (typeof v === 'number' && c.toLowerCase().includes('cents')) {
                return `<td>₽${(v / 100).toFixed(2)}</td>`;
              }
              return `<td>${v ?? '—'}</td>`;
            })
            .join('')}</tr>`
        )
        .join('')}</tbody>
    </table>`;
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row) =>
    Object.values(row)
      .map((val) => (typeof val === 'string' && val.includes(',') ? `"${val}"` : val))
      .join(',')
  );
  return [headers, ...rows].join('\n');
}
