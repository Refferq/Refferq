
import { t as __tr } from "@/i18n";
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ─── SSRF Protection ──────────────────────────────────────────
const BLOCKED_HOSTNAMES = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]',
  'metadata.google.internal', '169.254.169.254',
];

const PRIVATE_IP_RANGES = [
  /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^127\./, /^0\./, /^169\.254\./, /^fc00:/i, /^fe80:/i, /^::1$/,
];

function isUrlSafe(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.includes(hostname)) return false;
    if (PRIVATE_IP_RANGES.some(r => r.test(hostname))) return false;
    return true;
  } catch (_e) {
    return false;
  }
}

// Webhook event types
export type WebhookEventType = 
  | 'affiliate.created'
  | 'affiliate.approved'
  | 'affiliate.rejected'
  | 'referral.submitted'
  | 'referral.approved'
  | 'referral.rejected'
  | 'commission.created'
  | 'commission.approved'
  | 'commission.paid'
  | 'payout.requested'
  | 'payout.completed'
  | 'payout.failed';

export const AVAILABLE_EVENTS: WebhookEventType[] = [
  'affiliate.created',
  'affiliate.approved',
  'affiliate.rejected',
  'referral.submitted',
  'referral.approved',
  'referral.rejected',
  'commission.created',
  'commission.approved',
  'commission.paid',
  'payout.requested',
  'payout.completed',
  'payout.failed'
];

// Generate webhook signature
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Trigger webhook for all active webhooks subscribed to event
export async function triggerWebhook(eventType: WebhookEventType, eventData: any) {
  const results: any[] = [];

  try {
    // Get all active webhooks that subscribe to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true
      }
    });

    // Filter webhooks that have this event in their events array
    const subscribedWebhooks = webhooks.filter((w: any) => {
      const events = w.events as string[];
      return events.includes(eventType);
    });

    for (const webhook of subscribedWebhooks) {
      // SSRF protection: skip webhooks with unsafe URLs
      if (!isUrlSafe(webhook.url)) {
        console.warn(`Webhook ${webhook.id} skipped: URL targets a private/internal address`);
        results.push({ webhookId: webhook.id, success: false, error: __tr("URL targets a blocked address") });
        continue;
      }

      const payload = JSON.stringify({
        event: eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        webhookId: webhook.id
      });

      const signature = generateSignature(payload, webhook.secret);

      // Create log entry
      const log = await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          eventType,
          payload: JSON.parse(payload),
          status: 'PENDING',
          attempts: 1
        }
      });

      // Send webhook
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': eventType,
            'X-Webhook-Id': webhook.id,
            'X-Webhook-Timestamp': new Date().toISOString()
          },
          body: payload,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // Success
          await Promise.all([
            prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                lastTriggeredAt: new Date(),
                failureCount: 0
              }
            }),
            prisma.webhookLog.update({
              where: { id: log.id },
              data: {
                status: 'SUCCESS',
                statusCode: response.status,
                response: await response.text().catch(() => null),
                completedAt: new Date()
              }
            })
          ]);

          results.push({ webhookId: webhook.id, success: true, statusCode: response.status });
        } else {
          // Failed
          const newFailureCount = webhook.failureCount + 1;
          
          await Promise.all([
            prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                failureCount: newFailureCount,
                isActive: newFailureCount >= 10 ? false : webhook.isActive
              }
            }),
            prisma.webhookLog.update({
              where: { id: log.id },
              data: {
                status: 'FAILED',
                statusCode: response.status,
                error: `HTTP ${response.status}: ${response.statusText}`,
                response: await response.text().catch(() => null),
                completedAt: new Date()
              }
            })
          ]);

          results.push({ webhookId: webhook.id, success: false, error: `HTTP ${response.status}` });
        }
      } catch (error: any) {
        // Network error
        const newFailureCount = webhook.failureCount + 1;
        
        await Promise.all([
          prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              failureCount: newFailureCount,
              isActive: newFailureCount >= 10 ? false : webhook.isActive
            }
          }),
          prisma.webhookLog.update({
            where: { id: log.id },
            data: {
              status: 'FAILED',
              error: error.message || __tr("Network error"),
              completedAt: new Date()
            }
          })
        ]);

        results.push({ webhookId: webhook.id, success: false, error: error.message });
      }
    }
  } catch (error: any) {
    console.error('Error triggering webhooks:', error);
  }

  return results;
}

export const webhookService = {
  triggerWebhook,
  AVAILABLE_EVENTS
};
