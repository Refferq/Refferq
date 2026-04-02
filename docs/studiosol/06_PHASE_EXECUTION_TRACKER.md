# StudioSol Referral — Phase Execution Tracker

Дата обновления: **2 апреля 2026**

## 1. Execution Rules

1. Все изменения выполняются в feature-ветках с обязательным `npm run check`.
2. Любой финансовый endpoint должен проходить через audit logging.
3. Для tracking/webhook событий обязательны deduplication и replay-safe обработка.
4. Перед merge в `main` — green CI + security audit без `high`/`critical`.

## 2. Phase 0 (Hardening) — Status

### Done

- CI + quality scripts (`lint/typecheck/test/build`).
- baseline migrations + cleanup репозитория.
- tracking auth/CORS hardening.
- idempotency для conversion routes.
- корректная авто-выплата: связь payout с commissions.
- unit tests для payout planning/idempotency helpers.
- `recharts` v3 migration (типобезопасный `chart.tsx`, green typecheck/build).
- security gate: `npm run audit:prod` без `high/critical`.
- integration tests прогнаны на локальной PostgreSQL integration DB:
  - `integration: webhook conversion is idempotent for duplicate external event/order ids` ✅
  - `integration: auto payout marks approved commissions as paid and decrements balance` ✅
- staging dry run (core scenario) выполнен на локальном stand-in окружении:
  - first conversion ✅
  - duplicate conversion idempotent ✅
  - admin auto payout step ✅ (через auto-login `STAGING_ADMIN_EMAIL/STAGING_ADMIN_PASSWORD`).
- env/secrets provisioning playbook добавлен (`10_ENV_PROVISIONING_PLAYBOOK.md`).

### In Progress

- заполнение production/staging secrets и запуск на реальном staging домене.

### Exit Gate

- [x] Нет `as any` в критических admin financial routes.
- [x] Есть integration test для duplicate `order_id`/`event_id`.
- [x] Есть integration test для payout batch + commission status transitions.

## 3. Phase 1 (Referral MVP) — Work Breakdown

### Epic P1-E1: Deterministic Event Processing

- `P1-E1-T1` ✅ Стандартизирован payload contract (`event_id`, `order_id`, `occurred_at`) с поддержкой `camelCase` alias.
- `P1-E1-T2` ✅ Добавлены replay tests (повторный webhook с alias-полями и теми же external ids).
- `P1-E1-T3` ✅ Добавлены monitoring события и метрики:
  - audit actions: `conversion_duplicate`, `conversion_rejected`, `conversion_unattributed`, `conversion_attributed`;
  - admin dashboard metric window (`days`) с подсчётом event-processing counters.

### Epic P1-E2: Commission Lifecycle

- `P1-E2-T1` Проверить hold/mature cron consistency.
- `P1-E2-T2` Добавить tests на `PENDING -> APPROVED -> PAID`.
- `P1-E2-T3` Формализовать refund/clawback policy (и покрыть тестами).

### Epic P1-E3: Payout MVP Flow

- `P1-E3-T1` Валидация batch payout против approved commissions.
- `P1-E3-T2` Reconciliation view: payout + commissions snapshot.
- `P1-E3-T3` Staging dry run и UAT checklist.

## 4. Phase 2 (Financial Ops & Reliability) — Work Breakdown

### Epic P2-E1: Operational Reliability

- `P2-E1-T1` Sentry + structured logs для admin/track/webhook.
- `P2-E1-T2` Alerting на критические инциденты payout/conversion.
- `P2-E1-T3` Retry/reprocessing инструменты.

### Epic P2-E2: Finance Controls

- `P2-E2-T1` Approval workflow для payout batches.
- `P2-E2-T2` CSV/export compatibility с accounting.
- `P2-E2-T3` Incident runbook + rollback runbook.

## 5. Phase 3 (Growth & Optimization) — Work Breakdown

### Epic P3-E1: Partner Growth

- `P3-E1-T1` Partner activation funnel metrics.
- `P3-E1-T2` Commission offer experiments.
- `P3-E1-T3` Segment rules и cohort uplift.

### Epic P3-E2: Anti-Fraud and BI

- `P3-E2-T1` Fraud scoring v2.
- `P3-E2-T2` Manual review workflow.
- `P3-E2-T3` BI export + referral channel ROI dashboards.

## 6. Current Sprint (2–8 апреля 2026)

1. Закрыть техдолг financial APIs (`payouts/refunds/transactions`).
2. Добавить integration tests для idempotency и payout correctness.
3. Провести staging dry run и обновить readiness report.

## 7. Current Gate Snapshot (2 апреля 2026)

1. `npm run check` — ✅
2. `npm run audit:prod` — ✅
3. `npm run launch:env:report` — ❌ (не заведены production/staging env vars)
4. `npm run staging:dry-run` — ✅ (full scenario, включая admin segment)
