# StudioSol Referral — Staging Dry Run Protocol

Дата: **2 апреля 2026**

## 1. Цель

Подтвердить на staging критичный сценарий перед go-live:

`conversion create -> duplicate conversion -> idempotent response -> payout dry run`

## 2. Подготовка

1. Поднять staging-окружение и применить миграции.
2. Убедиться, что есть:
- активный affiliate с валидным `referralCode`;
- активный tracking API key с write scope;
- (опционально) admin user id для dry-run payouts.

## 3. Автоматизированный прогон

Команда:

```bash
STAGING_BASE_URL="https://<staging-domain>" \
STAGING_TRACKING_API_KEY="<tracking-key>" \
STAGING_REFERRAL_CODE="<affiliate-referral-code>" \
STAGING_ADMIN_USER_ID="<admin-user-id>" \
STAGING_ADMIN_AUTH_TOKEN="<admin-auth-token>" \
STAGING_ADMIN_EMAIL="<admin-email>" \
STAGING_ADMIN_PASSWORD="<admin-password>" \
npm run staging:dry-run
```

Переменные:

- `STAGING_BASE_URL` — обязательна.
- `STAGING_TRACKING_API_KEY` — обязательна.
- `STAGING_REFERRAL_CODE` — обязательна.
- `STAGING_ADMIN_USER_ID` — опциональна (если указана, скрипт проверит `/api/admin/payouts/auto` в режиме dry run).
- `STAGING_ADMIN_AUTH_TOKEN` — опциональна, но рекомендуется если `/api/admin/*` защищён middleware cookie-auth (`auth-token`).
- `STAGING_ADMIN_EMAIL` + `STAGING_ADMIN_PASSWORD` — опциональны; если `STAGING_ADMIN_AUTH_TOKEN` не задан, скрипт попробует получить cookie через `/api/auth/login`.

## 4. Критерии успешного dry run

1. Первый вызов `/api/track/conversion` возвращает `success: true`.
2. Второй вызов с тем же `orderId` возвращает `success: true` и `idempotent: true`.
3. (Опционально) `/api/admin/payouts/auto` с `dryRun: true` возвращает `success: true`:
- либо с `STAGING_ADMIN_AUTH_TOKEN`,
- либо через auto-login (`STAGING_ADMIN_EMAIL` + `STAGING_ADMIN_PASSWORD`).

## 5. Если dry run упал

1. Зафиксировать:
- endpoint;
- request id/order id;
- полный response body;
- server logs.

2. Открыть blocker в readiness report и не переходить к production rollout до устранения.
