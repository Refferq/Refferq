# StudioSol Referral — Launch Checklist

Дата: **2 апреля 2026**

## 1. Pre-Launch Gates

1. Код и сборка
- `npm run check` должен быть green.
- `npm run audit:prod` должен быть без high/critical.
- `npm run launch:env:strict` должен проходить без missing/placeholder env.
- `npm run launch:policy:strict` должен проходить без policy errors.

2. Данные и миграции
- Проверить `DATABASE_URL` на target production.
- Выполнить `npm run db:migrate`.
- Выполнить `npm run db:seed` (если требуется для bootstrap справочников).

3. Безопасность
- Валидные production-секреты (`JWT_SECRET`, `WEBHOOK_SECRET`, `CRON_SECRET`).
- Ограниченный allowlist в `TRACKING_ALLOWED_ORIGINS`.
- Проверка активных API-ключей для tracking/webhook интеграций.

4. Бизнес-контур
- Проверить commission hold policy в `ProgramSettings`.
- Проверить `minPayoutCents` и payout frequency.
- Проверить email-канал (Resend domain + test send).

## 2. Staging Dry Run (обязательный)

1. Сценарий:
- `referral_click` -> `conversion` -> `commission(PENDING)` -> maturation -> `commission(APPROVED)` -> payout batch.

2. Проверки:
- Дубликаты `order_id`/`event_id` не создают повторные conversion.
- Auto payout связывает payout с конкретными commissions.
- Refund корректно отменяет комиссии и аудитируется.

3. Аудит:
- В `audit_logs` должны быть события по payout/refund/commission operations.

## 3. Production Rollout

1. Подготовка
- Сделать deploy в low-traffic окно.
- Зафиксировать ответственных за rollback и инциденты.

2. Последовательность
- Deploy приложения.
- `npm run db:migrate`.
- smoke check ключевых API:
  - `/api/track/referral`
  - `/api/track/conversion`
  - `/api/webhook/conversion`
  - `/api/admin/payouts/auto`

3. Post-deploy мониторинг (первые 24 часа)
- Ошибки API 5xx и latency p95.
- Количество duplicate events и rejected events.
- Сходимость conversion/commission/payout счетчиков.

## 4. Go/No-Go Decision

Go только если:

- все pre-launch gates закрыты;
- staging dry run успешен;
- post-deploy smoke tests успешны;
- есть подтверждение Finance/Ops по payout/reconciliation.

## 5. Rollback Criteria

Немедленный rollback если:

- массовые 5xx в tracking/webhook endpoints;
- обнаружено расхождение в financial state transitions;
- критическая проблема безопасности (auth/key bypass, signature bypass).
