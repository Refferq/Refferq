# StudioSlow Referral — Readiness Report (3 апреля 2026)

## 1. Общий статус

- Текущая стадия: **Phase B -> Phase C transition**.
- Ветка: `codex/studiosol-phase1-execution`.
- Технический вердикт: **pre-launch ready (code level)**.
- Продакшен-вердикт: **not go-live yet** (есть внешние операционные блокеры).

## 2. Что закрыто

1. Quality/Security gates:
   - `npm run check` ✅
   - `npm run audit:prod` ✅
2. Launch env gate:
   - `npm run launch:env:strict` ✅
   - обязательны `CRON_SECRET`, `WEBHOOK_SECRET`, `JWT_SECRET`;
   - `OTP_DEV_MODE` запрещён в strict launch режиме.
3. Program policy gate:
   - `npm run launch:policy:strict` ✅
   - baseline `ProgramSettings` создан через `launch:policy:bootstrap`.
4. Event contract hardening:
   - `/api/track/conversion` требует correlation id (`event_id/order_id/idempotency_key`);
   - `/api/webhook/conversion` требует correlation id (`event_id/order_id`);
   - дедупликация учитывает `event_id` + `order_id`.
5. Integration tests:
   - idempotency/reject/auto-payout сценарии проходят на integration DB.
6. `launch:gate`:
   - проходит полностью с новым policy-step.
7. Launch evidence:
   - `npm run launch:evidence` ✅
   - артефакт: `docs/studiosol/evidence/launch-evidence-2026-04-03T08-57-01Z.md`.

## 3. Что ещё блокирует production-go-live

1. Реальный staging домен + реальные ключи StudioSlow:
   - нужно прогнать `launch:gate` и `staging:contract-smoke` не на localhost.
2. Server-side producer событий оплаты со стороны `studioslow.ru`:
   - подключить отправку production-подписанных conversion events.
3. Операционный sign-off:
   - Finance/Ops: payout/reconciliation подтверждение;
   - Legal: финальные условия партнёрской программы.
4. Hypercare:
   - подтверждённый on-call канал и rollback-ответственные на launch window.

## 4. Риски (актуальные)

1. Drift между staging и production секретами.
2. Интегратор StudioSlow может присылать события без стабильных correlation ids.
3. Неподтверждённые payout/reconciliation процедуры в реальном финконтуре.

## 5. Ближайший план (следующие 2-3 дня)

1. Прогнать реальный staging-runbook на домене StudioSlow.
2. Подключить/проверить server-side события от биллинга.
3. Закрыть finance/legal sign-off.
4. Подготовить go-live окно и ответственных.

## 6. Текущий итог

Кодовая база и launch-пайплайн готовы для контролируемого релиза.  
Для production запуска требуется закрыть внешние интеграционные и операционные блокеры.
