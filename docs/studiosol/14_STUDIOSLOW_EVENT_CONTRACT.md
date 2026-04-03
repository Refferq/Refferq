# StudioSlow Event Contract (Server-side to Refferq)

Дата: **3 апреля 2026**

Этот документ фиксирует минимальный контракт событий для интеграции `studioslow.ru` с Refferq в production.

## 1. Общие правила

1. Источник истины для финансового контура: server-side события от backend/billing StudioSlow.
2. Каждое событие должно иметь корреляционный идентификатор:
   - для `/api/track/conversion`: минимум один из `event_id|eventId`, `order_id|orderId`, `idempotency_key|idempotencyKey`;
   - для `/api/webhook/conversion`: минимум один из `event_id|eventId` или `order_id|orderId`.
3. Повторная отправка одного и того же `event_id` или `order_id` должна быть безопасна (идемпотентна).
4. Временная метка события передаётся в `occurred_at` (или `occurredAt`) в ISO-8601.

## 2. Endpoint A — Tracking API

URL: `POST /api/track/conversion`  
Auth: `x-api-key` (write scope)

### Минимальный payload

```json
{
  "referralCode": "AFF_ABC123",
  "amount": 2490.00,
  "currency": "RUB",
  "orderId": "ord_2026_000123",
  "eventId": "evt_2026_000987",
  "occurredAt": "2026-04-03T10:15:30Z",
  "customerEmail": "customer@example.com"
}
```

### Обязательные поля

1. `referralCode` (`referral_code`)
2. `amount` (или `amount_cents`)
3. Хотя бы один корреляционный идентификатор:
   - `eventId`/`event_id`
   - `orderId`/`order_id`
   - `idempotencyKey`/`idempotency_key` (или header `Idempotency-Key`)

## 3. Endpoint B — Webhook Conversion

URL: `POST /api/webhook/conversion`  
Auth: `x-api-key` **или** `x-webhook-signature`

### Минимальный payload

```json
{
  "event_type": "PURCHASE",
  "customer_email": "customer@example.com",
  "amount_cents": 249000,
  "currency": "RUB",
  "referral_code": "AFF_ABC123",
  "order_id": "ord_2026_000123",
  "event_id": "evt_2026_000987",
  "occurred_at": "2026-04-03T10:15:30Z"
}
```

### Обязательные поля

1. `event_type`
2. `customer_email`
3. Хотя бы один корреляционный идентификатор:
   - `event_id`/`eventId`
   - `order_id`/`orderId`

## 4. Формат ошибок контракта

При нарушении контракта API возвращает `400`:

1. `/api/track/conversion`:
   - `At least one correlation identifier is required: event_id/eventId, order_id/orderId, or idempotency_key/idempotencyKey`
2. `/api/webhook/conversion`:
   - `At least one correlation identifier is required: event_id/eventId or order_id/orderId`

## 5. Рекомендации отправителю событий (StudioSlow backend)

1. Генерировать `event_id` на стороне источника события (UUID/ULID).
2. Передавать стабильный `order_id` для всех событий заказа.
3. При retry передавать те же `event_id/order_id` (не генерировать заново).
4. Логировать `event_id` и HTTP ответ Refferq для разбора инцидентов.

## 6. Curl примеры

### Track conversion

```bash
curl -X POST "https://<refferq-domain>/api/track/conversion" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <tracking-key>" \
  -d '{
    "referralCode":"AFF_ABC123",
    "amount":2490.00,
    "currency":"RUB",
    "orderId":"ord_2026_000123",
    "eventId":"evt_2026_000987",
    "occurredAt":"2026-04-03T10:15:30Z",
    "customerEmail":"customer@example.com"
  }'
```

### Webhook conversion

```bash
curl -X POST "https://<refferq-domain>/api/webhook/conversion" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <webhook-or-admin-key>" \
  -d '{
    "event_type":"PURCHASE",
    "customer_email":"customer@example.com",
    "amount_cents":249000,
    "currency":"RUB",
    "referral_code":"AFF_ABC123",
    "order_id":"ord_2026_000123",
    "event_id":"evt_2026_000987",
    "occurred_at":"2026-04-03T10:15:30Z"
  }'
```

## 7. Автоматический smoke тест контракта

В репозитории добавлен готовый сценарий:

```bash
STAGING_BASE_URL="https://<staging-domain>" \
STAGING_TRACKING_API_KEY="<tracking-key>" \
STAGING_REFERRAL_CODE="<affiliate-referral-code>" \
npm run staging:contract-smoke
```

Что проверяет:

1. `400` на payload без correlation-id.
2. `200` на валидный payload с `event_id/order_id`.
3. `idempotent=true` на повторе того же события.
