import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveConversionEventContract,
  resolveTrackConversionIdempotency,
  resolveWebhookConversionExternalIds,
} from '../src/lib/conversion-idempotency';

test('resolveTrackConversionIdempotency: prefers header key and normalizes values', () => {
  const resolved = resolveTrackConversionIdempotency({
    orderId: '  order-123  ',
    bodyIdempotencyKey: ' body-key ',
    headerIdempotencyKey: ' header-key ',
  });

  assert.deepEqual(resolved, {
    orderId: 'order-123',
    idempotencyKey: 'header-key',
  });
});

test('resolveTrackConversionIdempotency: returns nulls for empty or non-string values', () => {
  const resolved = resolveTrackConversionIdempotency({
    orderId: '',
    bodyIdempotencyKey: 12345,
    headerIdempotencyKey: '   ',
  });

  assert.deepEqual(resolved, {
    orderId: null,
    idempotencyKey: null,
  });
});

test('resolveWebhookConversionExternalIds: falls back to metadata ids', () => {
  const resolved = resolveWebhookConversionExternalIds({
    eventMetadata: {
      event_id: 'evt_1',
      order_id: 'ord_1',
    },
  });

  assert.deepEqual(resolved, {
    externalEventId: 'evt_1',
    externalOrderId: 'ord_1',
  });
});

test('resolveConversionEventContract: normalizes contract ids and occurred_at', () => {
  const resolved = resolveConversionEventContract({
    eventId: ' evt_42 ',
    orderId: ' ord_42 ',
    occurredAt: '2026-04-02T10:00:00+03:00',
  });

  assert.deepEqual(resolved, {
    eventId: 'evt_42',
    orderId: 'ord_42',
    occurredAt: '2026-04-02T07:00:00.000Z',
  });
});

test('resolveConversionEventContract: falls back to metadata aliases and safe timestamp', () => {
  const resolved = resolveConversionEventContract({
    eventMetadata: {
      event_id: 'evt_meta',
      orderId: 'ord_meta',
      occurred_at: 'not-a-date',
    },
  });

  assert.equal(resolved.eventId, 'evt_meta');
  assert.equal(resolved.orderId, 'ord_meta');
  assert.equal(Number.isNaN(Date.parse(resolved.occurredAt)), false);
});

test('resolveWebhookConversionExternalIds: direct fields override metadata', () => {
  const resolved = resolveWebhookConversionExternalIds({
    eventId: ' evt_2 ',
    orderId: ' ord_2 ',
    eventMetadata: {
      event_id: 'evt_meta',
      orderId: 'ord_meta',
    },
  });

  assert.deepEqual(resolved, {
    externalEventId: 'evt_2',
    externalOrderId: 'ord_2',
  });
});
