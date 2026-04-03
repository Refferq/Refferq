# 1C-Bitrix (Управление сайтом) -> Refferq: Task for Developer

Дата: **3 апреля 2026**

Этот документ подготовлен как готовая постановка задачи для Bitrix-разработчика под **1C-Битрикс: Управление сайтом** (не Bitrix24 CRM).

## 1. Цель

Сделать production-ready интеграцию сайта на 1C-Битрикс с Refferq, чтобы:

1. Корректно учитывать партнёрскую атрибуцию в заказах.
2. Отправлять факты успешной оплаты в Refferq (conversion).
3. Отправлять возвраты/отмены в Refferq (refund).
4. Избежать дублей через идемпотентность и управлять retry.

## 2. Контракты Refferq

- `POST /api/webhook/conversion`
- `POST /api/webhook/refund`
- Базовый контракт: `14_STUDIOSLOW_EVENT_CONTRACT.md`

## 3. Scope работ

### 3.1 Захват атрибуции на сайте

- При входе пользователя по URL с `?ref=<code>` и/или `?attr=<key>`:
  - сохранить значения в cookie и в сессию,
  - TTL cookie: 30 дней (конфигурируемо),
  - приоритет: `attr` + `ref`, fallback только `ref`.

### 3.2 Сохранение атрибуции в заказ

- На создании заказа (`sale`) сохранить в свойства заказа:
  - `REFERRAL_CODE`
  - `ATTRIBUTION_KEY`
  - `REFFERQ_SYNC_STATUS` (`PENDING|SENT|ERROR`)
  - `REFFERQ_SYNC_ERROR` (текст последней ошибки)
  - `REFFERQ_EVENT_ID` (для conversion)
- Использовать стабильный `order_id` = ID заказа Bitrix.

### 3.3 Отправка conversion

Триггер: заказ оплачен (`OnSaleOrderPaid` или эквивалент события в проекте).

Payload (минимум):

```json
{
  "event_type": "PURCHASE",
  "customer_email": "customer@example.com",
  "amount_cents": 249000,
  "currency": "RUB",
  "referral_code": "AFF_ABC123",
  "attribution_key": "trk_xxx",
  "order_id": "order_12345",
  "event_id": "evt_order_12345_paid_v1",
  "occurred_at": "2026-04-03T10:15:30Z"
}
```

### 3.4 Отправка refund

Триггер: возврат оплаты / отмена оплаченного заказа.

Payload:

```json
{
  "customer_email": "customer@example.com",
  "referral_code": "AFF_ABC123",
  "amount_cents": 249000,
  "reason": "customer_refund",
  "external_id": "refund_12345"
}
```

### 3.5 Retry и идемпотентность

- Retry для ошибок сети/5xx: `1m -> 5m -> 15m` (минимум 3 попытки).
- При retry использовать те же `event_id` и `order_id`.
- При успехе ставить `REFFERQ_SYNC_STATUS=SENT`, очищать `REFFERQ_SYNC_ERROR`.
- При ошибке ставить `REFFERQ_SYNC_STATUS=ERROR`, записывать текст ошибки/HTTP-код.

### 3.6 Безопасность

- API ключ хранить в конфиге окружения/безопасных настройках проекта.
- Ключ не писать в логи.
- В логах маскировать e-mail и персональные данные при необходимости.

## 4. Технические точки реализации в 1C-Битрикс

- `local/php_interface/init.php` — подписка на обработчики событий.
- `sale` события (`OnSaleOrderPaid`, события отмены/возврата).
- Выделенный сервис интеграции в `local/lib/` или `local/modules/<module>/lib/`.
- Очередь retry через агенты Bitrix/cron-задачи.
- Лог: `local/logs/refferq-integration.log` (с ротацией).

## 5. Acceptance Criteria

- [ ] Оплата заказа отправляет conversion в Refferq.
- [ ] Повторная отправка того же события не создаёт дубль.
- [ ] Возврат отправляет refund и корректно влияет на комиссионный контур.
- [ ] Статус синка виден по заказу (`PENDING|SENT|ERROR`).
- [ ] Есть ручной re-sync для конкретного заказа.
- [ ] Есть краткая техдокументация по поддержке интеграции.

## 6. Тест-кейсы

1. Happy path: оплата заказа с атрибуцией -> `200`, статус `SENT`.
2. Duplicate send: тот же `event_id/order_id` -> дубль не создаётся.
3. Contract violation: без correlation id -> `400`.
4. Refund after paid conversion -> корректная обработка refund.
5. Temporary 500 from Refferq -> retry -> success.

## 7. Definition of Done

- Код интеграции в проекте 1C-Битрикс.
- Проверено на staging.
- Логи/ретраи работают.
- Документация и runbook переданы команде.
