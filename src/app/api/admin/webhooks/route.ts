import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { AVAILABLE_EVENTS, triggerWebhook, type WebhookEventType } from '@/lib/webhooks';


// ─── SSRF Protection: Validate webhook URLs ────────────────────
const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254',       // AWS/GCP metadata
  'metadata.internal',
];

const PRIVATE_IP_RANGES = [
  /^10\./,                 // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12
  /^192\.168\./,           // 192.168.0.0/16
  /^127\./,                // 127.0.0.0/8
  /^0\./,                  // 0.0.0.0/8
  /^169\.254\./,           // Link-local
  /^fc00:/i,               // IPv6 unique local
  /^fe80:/i,               // IPv6 link-local
  /^::1$/,                 // IPv6 loopback
];

function validateWebhookUrl(urlString: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch (_e) {
    return { valid: false, error: __tr("Invalid URL format") };
  }

  // Only allow HTTPS (and HTTP in development)
  const allowedProtocols = process.env.NODE_ENV === 'development'
    ? ['https:', 'http:']
    : ['https:'];
  if (!allowedProtocols.includes(parsed.protocol)) {
    return { valid: false, error: __tr("Only HTTPS webhook URLs are allowed") };
  }

  // Block known internal hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, error: __tr("Webhook URL must not point to internal or loopback addresses") };
  }

  // Block private IP ranges
  if (PRIVATE_IP_RANGES.some(range => range.test(hostname))) {
    return { valid: false, error: __tr("Webhook URL must not point to private network addresses") };
  }

  // Block URLs without a valid TLD (e.g., http://intranet)
  if (!hostname.includes('.') && hostname !== 'localhost') {
    return { valid: false, error: __tr("Webhook URL must use a fully qualified domain name") };
  }

  return { valid: true };
}

// Helper: Verify admin auth
async function verifyAdminAuth(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return { error: __tr("Admin access required"), status: 403 };
    }

    return { user };
  } catch (_error) {
    return { error: __tr("Invalid token"), status: 401 };
  }
}

// Helper: Generate webhook secret
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

// Helper: Generate HMAC signature
function generateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

// GET - List all webhooks
 async function GETHandler(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const includeLogs = url.searchParams.get('includeLogs') === 'true';

    const webhooks = await prisma.webhook.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        logs: includeLogs ? {
          orderBy: { createdAt: 'desc' },
          take: 10
        } : false
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get webhook statistics
    const stats = await prisma.webhookLog.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      webhooks: webhooks.map(w => ({
        ...w,
        secret: '••••••••' // Hide secret in list
      })),
      stats: {
        total: webhooks.length,
        active: webhooks.filter(w => w.isActive).length,
        pending: statsMap['PENDING'] || 0,
        success: statsMap['SUCCESS'] || 0,
        failed: statsMap['FAILED'] || 0,
        retrying: statsMap['RETRYING'] || 0
      },
      availableEvents: AVAILABLE_EVENTS
    });

  } catch (error) {
    console.error('Webhooks GET error:', error);
    return NextResponse.json(
      { error: __tr("Failed to fetch webhooks") },
      { status: 500 }
    );
  }
}

// POST - Create webhook, trigger webhook, or test webhook
 async function POSTHandler(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // CREATE - Create new webhook
    if (action === 'create') {
      const { name, url, events } = body;

      if (!name || !url) {
        return NextResponse.json(
          { error: __tr("Name and URL are required") },
          { status: 400 }
        );
      }

      // Validate URL (SSRF protection)
      const urlValidation = validateWebhookUrl(url);
      if (!urlValidation.valid) {
        return NextResponse.json(
          { error: urlValidation.error },
          { status: 400 }
        );
      }

      // Validate events
      const selectedEvents = events || AVAILABLE_EVENTS;
      const invalidEvents = selectedEvents.filter((e: string) => !AVAILABLE_EVENTS.includes(e as WebhookEventType));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: __tr("Invalid events: {0}", [invalidEvents.join(', ')]) },
          { status: 400 }
        );
      }

      const secret = generateWebhookSecret();

      const webhook = await prisma.webhook.create({
        data: {
          name,
          url,
          secret,
          events: selectedEvents,
          isActive: true,
          failureCount: 0
        }
      });

      return NextResponse.json({
        success: true,
        webhook: {
          ...webhook,
          secret // Return secret only on creation
        },
        message: __tr("Webhook created successfully. Save your secret - it will not be shown again.")
      });
    }

    // TEST - Test webhook endpoint
    if (action === 'test') {
      const { webhookId, url: testUrl } = body;

      let webhookUrl = testUrl;
      const crypto = await import('crypto');
      let webhookSecret = crypto.randomBytes(32).toString('hex');

      if (webhookId) {
        const webhook = await prisma.webhook.findUnique({
          where: { id: webhookId }
        });

        if (!webhook) {
          return NextResponse.json(
            { error: __tr("Webhook not found") },
            { status: 404 }
          );
        }

        webhookUrl = webhook.url;
        webhookSecret = webhook.secret;
      }

      if (!webhookUrl) {
        return NextResponse.json(
          { error: __tr("Webhook URL is required") },
          { status: 400 }
        );
      }

      // SSRF protection: validate the test URL
      const testUrlValidation = validateWebhookUrl(webhookUrl);
      if (!testUrlValidation.valid) {
        return NextResponse.json(
          { error: testUrlValidation.error },
          { status: 400 }
        );
      }

      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: { 
          message: __tr("This is a test webhook from Refferq"),
          testId: crypto.randomBytes(8).toString('hex')
        }
      };

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Refferq-Event': 'test',
            'X-Refferq-Signature': generateSignature(testPayload, webhookSecret),
            'X-Refferq-Delivery': `test_${Date.now()}`
          },
          body: JSON.stringify(testPayload)
        });

        const responseText = await response.text();

        // Log the test
        if (webhookId) {
          await prisma.webhookLog.create({
            data: {
              webhookId,
              eventType: 'test',
              payload: testPayload,
              status: response.ok ? 'SUCCESS' : 'FAILED',
              statusCode: response.status,
              response: responseText.substring(0, 1000),
              completedAt: new Date()
            }
          });
        }

        return NextResponse.json({
          success: response.ok,
          statusCode: response.status,
          message: response.ok ? __tr("Webhook test successful") : __tr("Webhook test failed with status {0}", [response.status]),
          response: responseText.substring(0, 500)
        });

      } catch (error: any) {
        // Log the failure
        if (webhookId) {
          await prisma.webhookLog.create({
            data: {
              webhookId,
              eventType: 'test',
              payload: testPayload,
              status: 'FAILED',
              error: error.message,
              completedAt: new Date()
            }
          });
        }

        return NextResponse.json({
          success: false,
          message: __tr("Webhook test failed: connection error")
        });
      }
    }

    // TRIGGER - Manually trigger webhook for specific event
    if (action === 'trigger') {
      const { eventType, eventData } = body;

      if (!eventType || !eventData) {
        return NextResponse.json(
          { error: __tr("Event type and data are required") },
          { status: 400 }
        );
      }

      if (!AVAILABLE_EVENTS.includes(eventType)) {
        return NextResponse.json(
          { error: __tr("Invalid event type: {0}", [eventType]) },
          { status: 400 }
        );
      }

      const results = await triggerWebhook(eventType, eventData);

      return NextResponse.json({
        success: true,
        message: __tr("Webhook triggered for {0}", [eventType]),
        results
      });
    }

    return NextResponse.json(
      { error: __tr("Invalid action. Use: create, test, or trigger") },
      { status: 400 }
    );

  } catch (error) {
    console.error('Webhooks POST error:', error);
    return NextResponse.json(
      { error: __tr("Failed to process webhook request") },
      { status: 500 }
    );
  }
}

// PUT - Update webhook
 async function PUTHandler(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, name, url, events, isActive, regenerateSecret } = body;

    if (!id) {
      return NextResponse.json(
        { error: __tr("Webhook ID is required") },
        { status: 400 }
      );
    }

    const existingWebhook = await prisma.webhook.findUnique({
      where: { id }
    });

    if (!existingWebhook) {
      return NextResponse.json(
        { error: __tr("Webhook not found") },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (url !== undefined) {
      const updateUrlValidation = validateWebhookUrl(url);
      if (!updateUrlValidation.valid) {
        return NextResponse.json(
          { error: updateUrlValidation.error },
          { status: 400 }
        );
      }
      updateData.url = url;
    }
    if (events !== undefined) updateData.events = events;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (regenerateSecret) {
      updateData.secret = generateWebhookSecret();
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        secret: regenerateSecret ? webhook.secret : '••••••••'
      },
      message: regenerateSecret 
        ? __tr("Webhook updated with new secret. Save your secret - it will not be shown again.")
        : __tr("Webhook updated successfully")
    });

  } catch (error) {
    console.error('Webhooks PUT error:', error);
    return NextResponse.json(
      { error: __tr("Failed to update webhook") },
      { status: 500 }
    );
  }
}

// DELETE - Remove webhook
 async function DELETEHandler(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(request.url);
    const webhookId = url.searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { error: __tr("Webhook ID is required") },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId }
    });

    if (!webhook) {
      return NextResponse.json(
        { error: __tr("Webhook not found") },
        { status: 404 }
      );
    }

    // Delete webhook (cascades to logs)
    await prisma.webhook.delete({
      where: { id: webhookId }
    });

    return NextResponse.json({
      success: true,
      message: __tr("Webhook deleted successfully")
    });

  } catch (error) {
    console.error('Webhooks DELETE error:', error);
    return NextResponse.json(
      { error: __tr("Failed to delete webhook") },
      { status: 500 }
    );
  }
}


export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
export const PUT = withSystemLocale(PUTHandler);
export const DELETE = withSystemLocale(DELETEHandler);
