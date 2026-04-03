function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export interface TrackConversionIdempotencyInput {
  orderId?: unknown;
  bodyIdempotencyKey?: unknown;
  headerIdempotencyKey?: unknown;
}

export interface ResolvedTrackConversionIdempotency {
  orderId: string | null;
  idempotencyKey: string | null;
}

export function resolveTrackConversionIdempotency(
  input: TrackConversionIdempotencyInput
): ResolvedTrackConversionIdempotency {
  const headerIdempotencyKey = normalizeOptionalString(input.headerIdempotencyKey);
  const bodyIdempotencyKey = normalizeOptionalString(input.bodyIdempotencyKey);

  return {
    orderId: normalizeOptionalString(input.orderId),
    idempotencyKey: headerIdempotencyKey ?? bodyIdempotencyKey,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeOccurredAt(value: unknown, fallbackIso: string): string {
  if (typeof value !== 'string') {
    return fallbackIso;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallbackIso;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackIso;
  }

  return parsed.toISOString();
}

export interface ConversionEventContractInput {
  eventId?: unknown;
  orderId?: unknown;
  occurredAt?: unknown;
  timestamp?: unknown;
  eventMetadata?: Record<string, unknown> | null | undefined;
}

export interface ResolvedConversionEventContract {
  eventId: string | null;
  orderId: string | null;
  occurredAt: string;
}

export function resolveConversionEventContract(
  input: ConversionEventContractInput
): ResolvedConversionEventContract {
  const metadata = toRecord(input.eventMetadata);
  const nowIso = new Date().toISOString();

  const eventId =
    normalizeOptionalString(input.eventId) ??
    normalizeOptionalString(metadata.event_id) ??
    normalizeOptionalString(metadata.eventId);

  const orderId =
    normalizeOptionalString(input.orderId) ??
    normalizeOptionalString(metadata.order_id) ??
    normalizeOptionalString(metadata.orderId);

  const occurredAt = normalizeOccurredAt(
    input.occurredAt ??
      input.timestamp ??
      metadata.occurred_at ??
      metadata.occurredAt ??
      metadata.timestamp,
    nowIso
  );

  return {
    eventId,
    orderId,
    occurredAt,
  };
}

export interface WebhookConversionExternalIdsInput {
  eventId?: unknown;
  orderId?: unknown;
  eventMetadata?: Record<string, unknown> | null | undefined;
}

export interface ResolvedWebhookConversionExternalIds {
  externalEventId: string | null;
  externalOrderId: string | null;
}

export function resolveWebhookConversionExternalIds(
  input: WebhookConversionExternalIdsInput
): ResolvedWebhookConversionExternalIds {
  const contract = resolveConversionEventContract({
    eventId: input.eventId,
    orderId: input.orderId,
    eventMetadata: input.eventMetadata,
  });

  return {
    externalEventId: contract.eventId,
    externalOrderId: contract.orderId,
  };
}

export interface ConversionCorrelationIdsInput {
  eventId?: unknown;
  orderId?: unknown;
  idempotencyKey?: unknown;
}

export interface ResolvedConversionCorrelationIds {
  eventId: string | null;
  orderId: string | null;
  idempotencyKey: string | null;
}

export function resolveConversionCorrelationIds(
  input: ConversionCorrelationIdsInput
): ResolvedConversionCorrelationIds {
  return {
    eventId: normalizeOptionalString(input.eventId),
    orderId: normalizeOptionalString(input.orderId),
    idempotencyKey: normalizeOptionalString(input.idempotencyKey),
  };
}

export function hasConversionCorrelationIds(input: ConversionCorrelationIdsInput): boolean {
  const resolved = resolveConversionCorrelationIds(input);
  return Boolean(resolved.eventId || resolved.orderId || resolved.idempotencyKey);
}
