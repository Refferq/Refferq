# Technical Stack & Architecture (Target for StudioSol)

## 1. Рекомендованный стек

Базироваться на Refferq, но усилить:

- Runtime: Node.js 22 LTS.
- App: Next.js 16 + TypeScript strict.
- DB: PostgreSQL + Prisma (только через migrations).
- Cache/Queues: Redis (rate limit, attribution cache, jobs).
- Async jobs: BullMQ/Temporal-lite pattern для webhook retry и payouts.
- Email: Resend (или Postmark) с доменной аутентификацией.
- Observability: Sentry + structured logs + basic metrics dashboard.
- CI: GitHub Actions (lint, typecheck, tests, security scan, build).

## 2. Логическая архитектура

1. Public Tracking Layer
- Endpoint'ы для click/conversion/refund событий.
- HMAC/API key validation + rate limiting + idempotency.

2. Attribution & Commission Engine
- Привязка conversion к affiliate.
- Расчёт комиссии по policy и hold period.

3. Admin Operations Layer
- Ручные корректировки, batch payouts, reconciliation отчёты.

4. Partner Portal Layer
- Dashboard, рефссылки, выплаты, статус комиссий.

5. Integration Layer
- Входящие webhooks от биллинга.
- Исходящие webhooks в CRM/BI.

## 3. Минимальные архитектурные изменения к текущему Refferq

1. Унифицировать API key модель (убрать дублирующие подходы).
2. Ввести `event_id`/`idempotency_key` и уникальные индексы.
3. Убрать критические `as any` в доменных API.
4. Ввести миграционный пайплайн (`prisma migrate deploy`) и seed.
5. Добавить read/write test pyramid:
- unit для commission/attribution;
- integration для API + DB;
- e2e для "click -> conversion -> payout".

## 4. Security Baseline

- Секреты: только env/secrets manager.
- Подпись webhook: HMAC SHA-256 + timestamp tolerance.
- Auth cookie: httpOnly + secure + CSRF token для мутаций.
- RBAC для admin/team.
- Audit trail для финансовых операций.
- Periodic dependency audit.

## 5. Data Contracts (MVP)

События:

- `referral_click`
- `conversion_created`
- `conversion_paid`
- `conversion_refunded`

Обязательные поля:

- `event_id` (uuid)
- `occurred_at`
- `source`
- `affiliate_ref` (code/key)
- `order_id` (для conversion/refund)
- `amount_cents`, `currency`

## 6. Стратегия интеграции со StudioSol

Вариант A (быстрый MVP):
- JS tracker на сайте + server-side conversion webhook.

Вариант B (предпочтительный prod):
- server-side only events от StudioSol backend/billing.
- Клиентский tracker только как вспомогательный канал.

Рекомендация: запускать A+B, но расчёт и payout базировать на server-side verified events.
