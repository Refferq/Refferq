# Implementation Roadmap — StudioSol Referral Program

## Общий подход

- Strategy: `Fork -> Hardening -> MVP -> Scale`.
- Релизы короткими итерациями с quality gates.
- Каждый этап завершается измеримыми критериями готовности.

## Текущий статус (на 2 апреля 2026)

- Ветка исполнения: `codex/studiosol-phase1-execution`.
- Phase 0 практически закрыт (основа готова):
  - ✅ lint/typecheck/test/build + CI.
  - ✅ API key hardening и CORS для tracking.
  - ✅ idempotency для tracking/webhook conversion.
  - ✅ исправления финансовой корректности auto-payout.
  - ✅ baseline unit tests на payout/idempotency helpers.
  - ✅ стандартизирован event contract (`event_id/order_id/occurred_at`) + replay-safe parsing.
  - ✅ telemetry по event processing (`duplicate/rejected/unattributed/attributed`).
- Остаток Phase 0/Phase 1 gate:
  - заполнить production/staging env secrets.

## Phase 0 — Hardening Foundation (1-2 недели)

Цель: сделать базу безопасной и воспроизводимой.

### Deliverables

1. Починить quality pipeline:
- рабочие lint/typecheck/test скрипты;
- CI workflow на PR.

2. Security cleanup:
- закрыть high vulnerabilities;
- унифицировать API key/auth схему tracking API.

3. Data discipline:
- migrations + seed;
- убрать `prisma/dev.db` из репозитория;
- нормализовать `.env.example`.

4. Code quality:
- сократить/убрать `as any` в критических API.

### Exit Criteria

- CI green на PR.
- Нет high vulnerabilities.
- Есть воспроизводимый bootstrap новой среды.

## Phase 1 — Referral MVP (2-3 недели)

Цель: закрыть реальный контур "клик -> конверсия -> комиссия".

### Deliverables

1. Tracking contracts + idempotency.
2. Attribution policy (last-touch configurable).
3. Commission engine с hold period.
4. Admin/affiliate dashboards с корректными статусами.
5. Минимум 1 end-to-end flow test.

### Exit Criteria

- На staging подтверждён сценарий:
  - click event;
  - paid conversion;
  - commission created/matured;
  - payout batch generated.

### План исполнения Phase 1 (по неделям)

1. Неделя 1
- Закрыть критический техдолг API (`transactions/payouts/refunds`).
- Добавить integration tests для:
  - duplicate `order_id`/`event_id`;
  - payout batch с hold/mature policy.
- Подготовить staging fixtures (affiliates/referrals/conversions).

2. Неделя 2
- Завершить контур Commission Engine:
  - hold period;
  - maturation job;
  - cancellation/refund clawback policy.
- Провести end-to-end dry run на staging.

3. Неделя 3
- UX полировка admin/affiliate dashboard по статуса-м комиссий/выплат.
- MVP UAT и Go/No-Go.

## Phase 2 — Financial Ops & Reliability (2 недели)

Цель: подготовка к стабильной операционной работе.

### Deliverables

1. Payout operations:
- batch approvals;
- CSV/export;
- reconciliation view.

2. Observability:
- critical alerts;
- event processing dashboard;
- error budget monitoring.

3. Compliance artifacts:
- policy docs;
- terms and payout conditions.

### Exit Criteria

- Ошибки расчетов < 1%.
- Есть runbook по инцидентам и reprocessing.

### План исполнения Phase 2

1. Payout operations hardening
- approve/reject workflow для batch payouts;
- reconciliation экран (`commissions <-> payouts <-> refunds`);
- экспорт и сверка с бухгалтерией.

2. Observability
- Sentry для API exceptions;
- dashboard критических бизнес-метрик;
- alerting на задержки обработки событий.

3. Ops runbooks
- incident runbook;
- reprocessing runbook;
- rollback/checklist релиза.

## Phase 3 — Growth & Optimization (пост-MVP)

### Deliverables

1. Fraud scoring v2.
2. Segment-specific commission rules.
3. BI/export в вашу аналитику.
4. Эксперименты по росту referral conversion.

### План исполнения Phase 3

1. Growth experiments
- A/B тестирование attribution windows и commission offers.
- Онбординг-потоки партнёров (activation uplift).

2. Anti-fraud v2
- scoring и флаги риска;
- ручная модерация спорных случаев.

3. BI and forecasting
- выгрузка событий/финансов в BI;
- cohort/ROI отчётность по каналам и группам партнёров.

## Бэклог эпиков (приоритет)

1. `E1` Security & integrity hardening.
2. `E2` Deterministic attribution and idempotent events.
3. `E3` Commission and payout correctness.
4. `E4` Observability and supportability.
5. `E5` Partner growth tooling.

## KPI по этапам

- Phase 0:
  - CI reliability 100% на mandatory checks.
- Phase 1:
  - Event attribution success >= 98%.
- Phase 2:
  - Payout processing SLA <= 2 business days.
- Phase 3:
  - Referral share of new MRR >= 20%.

## Стартовый 10-дневный план (практически)

1. Day 1-2: security + dependency fixes, quality scripts.
2. Day 3-4: migrations/seed/bootstrap.
3. Day 5-6: tracking API contracts + idempotency.
4. Day 7: commission hold and payout correctness tests.
5. Day 8: admin dashboards reconciliation checks.
6. Day 9: staging E2E dry run.
7. Day 10: Go/No-Go review по MVP.

## Следующий 7-дневный execution block (2–8 апреля 2026)

1. Day 1-2
- Довести типизацию и убрать `as any` в финансовых API.

2. Day 3-4
- Интеграционные тесты: tracking/webhook idempotency + payouts.

3. Day 5
- Maturation/hold policy проверки и фиксация edge-cases.

4. Day 6
- Staging dry run по сценарию `click -> conversion -> commission -> payout`.

5. Day 7
- Обновление readiness-отчёта и фиксация Phase 1 gate status.
