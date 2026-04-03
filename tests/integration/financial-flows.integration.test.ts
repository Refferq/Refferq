import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import * as bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const integrationDbUrl = process.env.INTEGRATION_DATABASE_URL;
const runIntegration = Boolean(integrationDbUrl);

if (integrationDbUrl) {
  process.env.DATABASE_URL = integrationDbUrl;
}

function isSafeIntegrationDb(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('test');
}

if (integrationDbUrl && !isSafeIntegrationDb(integrationDbUrl)) {
  throw new Error('INTEGRATION_DATABASE_URL does not look like a safe local/test database URL');
}

const it = runIntegration ? test : test.skip;

it(
  'integration: webhook conversion is idempotent for duplicate external event/order ids',
  async () => {
    const [{ prisma }, webhookModule] = await Promise.all([
      import('@/lib/prisma'),
      import('@/app/api/webhook/conversion/route'),
    ]);
    const webhookPost = webhookModule.POST;

    const suffix = `it_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const hashedTestPassword = await bcrypt.hash(
      `integration-test-password-${suffix}`,
      12
    );
    const adminEmail = `admin_${suffix}@example.com`;
    const affiliateEmail = `affiliate_${suffix}@example.com`;
    const referralCode = `REF${Math.floor(Math.random() * 1_000_000)}`;
    const rawApiKey = `rfq_${suffix}_${crypto.randomBytes(8).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
    const externalEventId = `evt_${suffix}`;
    const orderId = `ord_${suffix}`;

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Integration Admin',
        password: hashedTestPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const affiliateUser = await prisma.user.create({
      data: {
        email: affiliateEmail,
        name: 'Integration Affiliate',
        password: hashedTestPassword,
        role: 'AFFILIATE',
        status: 'ACTIVE',
      },
    });

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        referralCode,
        payoutDetails: {},
      },
    });

    await prisma.commissionRule.create({
      data: {
        name: `Integration Default Rule ${suffix}`,
        type: 'PERCENTAGE',
        value: 20,
        isDefault: true,
      },
    });

    await prisma.apiKey.create({
      data: {
        name: `integration-key-${suffix}`,
        keyHash: apiKeyHash,
        prefix: rawApiKey.slice(0, 8),
        userId: adminUser.id,
        scopes: ['write'],
        isActive: true,
      },
    });

    try {
      const payload = {
        event_type: 'PURCHASE',
        amount_cents: 50000,
        currency: 'USD',
        customer_email: `customer_${suffix}@example.com`,
        referral_code: referralCode,
        event_id: externalEventId,
        order_id: orderId,
        event_metadata: {
          source: 'integration-test',
        },
      };

      const firstRequest = new Request('http://localhost/api/webhook/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': rawApiKey,
        },
        body: JSON.stringify(payload),
      }) as NextRequest;

      const firstResponse = await webhookPost(firstRequest);
      const firstJson = await firstResponse.json();

      assert.equal(firstResponse.status, 200);
      assert.equal(firstJson.success, true);
      assert.notEqual(firstJson.duplicate, true);

      const replayPayload = {
        eventType: 'PURCHASE',
        amountCents: 50000,
        currency: 'USD',
        customerEmail: `customer_${suffix}@example.com`,
        referralCode,
        eventId: externalEventId,
        orderId,
        eventMetadata: {
          source: 'integration-test-replay',
        },
      };

      const secondRequest = new Request('http://localhost/api/webhook/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': rawApiKey,
        },
        body: JSON.stringify(replayPayload),
      }) as NextRequest;

      const secondResponse = await webhookPost(secondRequest);
      const secondJson = await secondResponse.json();

      assert.equal(secondResponse.status, 200);
      assert.equal(secondJson.success, true);
      assert.equal(secondJson.duplicate, true);

      const conversionCount = await prisma.conversion.count({
        where: {
          affiliateId: affiliate.id,
          eventMetadata: {
            path: ['externalEventId'],
            equals: externalEventId,
          },
        },
      });

      assert.equal(conversionCount, 1);
    } finally {
      await prisma.auditLog.deleteMany({
        where: { actorId: { in: [adminUser.id, affiliateUser.id] } },
      });
      await prisma.commission.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.conversion.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.apiKey.deleteMany({ where: { userId: adminUser.id } });
      await prisma.commissionRule.deleteMany({ where: { name: { contains: suffix } } });
      await prisma.referral.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.affiliate.deleteMany({ where: { id: affiliate.id } });
      await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, affiliateUser.id] } } });
    }
  }
);

it(
  'integration: track conversion rejects payloads without correlation identifiers',
  async () => {
    const [{ prisma }, trackModule] = await Promise.all([
      import('@/lib/prisma'),
      import('@/app/api/track/conversion/route'),
    ]);
    const trackPost = trackModule.POST;

    const suffix = `it_track_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const hashedTestPassword = await bcrypt.hash(
      `integration-test-password-${suffix}`,
      12
    );
    const adminEmail = `admin_${suffix}@example.com`;
    const affiliateEmail = `affiliate_${suffix}@example.com`;
    const referralCode = `REF${Math.floor(Math.random() * 1_000_000)}`;
    const rawApiKey = `rfq_${suffix}_${crypto.randomBytes(8).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Integration Admin',
        password: hashedTestPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const affiliateUser = await prisma.user.create({
      data: {
        email: affiliateEmail,
        name: 'Integration Affiliate',
        password: hashedTestPassword,
        role: 'AFFILIATE',
        status: 'ACTIVE',
      },
    });

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        referralCode,
        payoutDetails: {},
      },
    });

    await prisma.apiKey.create({
      data: {
        name: `integration-track-key-${suffix}`,
        keyHash: apiKeyHash,
        prefix: rawApiKey.slice(0, 8),
        userId: adminUser.id,
        scopes: ['write'],
        isActive: true,
      },
    });

    try {
      const request = new Request('http://localhost/api/track/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': rawApiKey,
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          referralCode,
          customerEmail: `customer_${suffix}@example.com`,
          amount: 2500,
          currency: 'RUB',
          // Intentionally omitting event/order/idempotency identifiers
        }),
      }) as NextRequest;

      const response = await trackPost(request);
      const json = await response.json();

      assert.equal(response.status, 400);
      assert.equal(json.success, false);
      assert.match(String(json.error), /At least one correlation identifier is required/i);

      const conversionCount = await prisma.conversion.count({
        where: { affiliateId: affiliate.id },
      });
      assert.equal(conversionCount, 0);
    } finally {
      await prisma.auditLog.deleteMany({
        where: { actorId: { in: [adminUser.id, affiliateUser.id] } },
      });
      await prisma.commission.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.conversion.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.apiKey.deleteMany({ where: { userId: adminUser.id } });
      await prisma.referral.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.affiliate.deleteMany({ where: { id: affiliate.id } });
      await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, affiliateUser.id] } } });
    }
  }
);

it(
  'integration: webhook conversion rejects payloads without event_id/order_id',
  async () => {
    const [{ prisma }, webhookModule] = await Promise.all([
      import('@/lib/prisma'),
      import('@/app/api/webhook/conversion/route'),
    ]);
    const webhookPost = webhookModule.POST;

    const suffix = `it_webhook_contract_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const hashedTestPassword = await bcrypt.hash(
      `integration-test-password-${suffix}`,
      12
    );
    const adminEmail = `admin_${suffix}@example.com`;
    const affiliateEmail = `affiliate_${suffix}@example.com`;
    const referralCode = `REF${Math.floor(Math.random() * 1_000_000)}`;
    const rawApiKey = `rfq_${suffix}_${crypto.randomBytes(8).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Integration Admin',
        password: hashedTestPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const affiliateUser = await prisma.user.create({
      data: {
        email: affiliateEmail,
        name: 'Integration Affiliate',
        password: hashedTestPassword,
        role: 'AFFILIATE',
        status: 'ACTIVE',
      },
    });

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        referralCode,
        payoutDetails: {},
      },
    });

    await prisma.apiKey.create({
      data: {
        name: `integration-webhook-key-${suffix}`,
        keyHash: apiKeyHash,
        prefix: rawApiKey.slice(0, 8),
        userId: adminUser.id,
        scopes: ['write'],
        isActive: true,
      },
    });

    try {
      const request = new Request('http://localhost/api/webhook/conversion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': rawApiKey,
        },
        body: JSON.stringify({
          event_type: 'PURCHASE',
          customer_email: `customer_${suffix}@example.com`,
          amount_cents: 50000,
          currency: 'RUB',
          referral_code: referralCode,
          // Intentionally omitting event_id/order_id
        }),
      }) as NextRequest;

      const response = await webhookPost(request);
      const json = await response.json();

      assert.equal(response.status, 400);
      assert.equal(json.success, false);
      assert.match(String(json.message), /At least one correlation identifier is required/i);

      const conversionCount = await prisma.conversion.count({
        where: { affiliateId: affiliate.id },
      });
      assert.equal(conversionCount, 0);
    } finally {
      await prisma.auditLog.deleteMany({
        where: { actorId: { in: [adminUser.id, affiliateUser.id] } },
      });
      await prisma.commission.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.conversion.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.apiKey.deleteMany({ where: { userId: adminUser.id } });
      await prisma.referral.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.affiliate.deleteMany({ where: { id: affiliate.id } });
      await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, affiliateUser.id] } } });
    }
  }
);

it(
  'integration: auto payout marks approved commissions as paid and decrements balance',
  async () => {
    const [{ prisma }, autoPayoutModule] = await Promise.all([
      import('@/lib/prisma'),
      import('@/app/api/admin/payouts/auto/route'),
    ]);
    const autoPayoutPost = autoPayoutModule.POST;

    const suffix = `it_payout_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const hashedTestPassword = await bcrypt.hash(
      `integration-test-password-${suffix}`,
      12
    );
    const adminEmail = `admin_${suffix}@example.com`;
    const affiliateEmail = `affiliate_${suffix}@example.com`;

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Integration Admin',
        password: hashedTestPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const affiliateUser = await prisma.user.create({
      data: {
        email: affiliateEmail,
        name: 'Integration Affiliate',
        password: hashedTestPassword,
        role: 'AFFILIATE',
        status: 'ACTIVE',
      },
    });

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: affiliateUser.id,
        referralCode: `RFQ${Math.floor(Math.random() * 1_000_000)}`,
        payoutDetails: {},
        balanceCents: 150000,
      },
    });

    const conversion = await prisma.conversion.create({
      data: {
        affiliateId: affiliate.id,
        eventType: 'PURCHASE',
        amountCents: 150000,
        currency: 'USD',
        status: 'APPROVED',
      },
    });

    const commission = await prisma.commission.create({
      data: {
        conversionId: conversion.id,
        affiliateId: affiliate.id,
        userId: affiliateUser.id,
        amountCents: 120000,
        rate: 0.2,
        status: 'APPROVED',
      },
    });

    try {
      const request = new Request('http://localhost/api/admin/payouts/auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': adminUser.id,
        },
        body: JSON.stringify({ dryRun: false }),
      }) as NextRequest;

      const response = await autoPayoutPost(request);
      const json = await response.json();

      assert.equal(response.status, 200);
      assert.equal(json.success, true);

      const updatedCommission = await prisma.commission.findUnique({
        where: { id: commission.id },
      });
      assert.equal(updatedCommission?.status, 'PAID');
      assert.ok(updatedCommission?.payoutId);

      const updatedAffiliate = await prisma.affiliate.findUnique({
        where: { id: affiliate.id },
      });
      assert.equal(updatedAffiliate?.balanceCents, 30000);

      const payout = await prisma.payout.findUnique({
        where: { id: updatedCommission?.payoutId || '' },
      });
      assert.ok(payout);
      assert.equal(payout?.amountCents, 120000);
    } finally {
      await prisma.auditLog.deleteMany({
        where: { actorId: { in: [adminUser.id, affiliateUser.id] } },
      });
      await prisma.commission.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.payout.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.conversion.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.referral.deleteMany({ where: { affiliateId: affiliate.id } });
      await prisma.affiliate.deleteMany({ where: { id: affiliate.id } });
      await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, affiliateUser.id] } } });
    }
  }
);
