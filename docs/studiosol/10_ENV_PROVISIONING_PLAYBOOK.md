# StudioSol Referral — Env Provisioning Playbook

Дата: **2 апреля 2026**

## 1. Цель

Закрыть финальный launch-блокер: корректно заполнить production/staging environment variables и пройти `launch:env:strict`.

## 2. Обязательные переменные

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TRACKING_ALLOWED_ORIGINS`
- `WEBHOOK_SECRET`

Шаблон: [`.env.launch.example`](/Users/kmrkzn/Workspace/Projects/SS_AFFSPA/.env.launch.example)

## 3. Генерация секретов

```bash
npm run launch:secrets
```

Команда генерирует безопасные значения для:

- `JWT_SECRET`
- `WEBHOOK_SECRET`

## 4. Порядок заполнения

1. Заполнить `DATABASE_URL` на staging.
2. Заполнить `NEXT_PUBLIC_APP_URL` staging-доменом.
3. Указать `RESEND_API_KEY` и `RESEND_FROM_EMAIL`.
4. Указать `TRACKING_ALLOWED_ORIGINS` (comma-separated absolute origins).
5. Добавить сгенерированные `JWT_SECRET` и `WEBHOOK_SECRET`.
6. Повторить те же шаги для production.

## 5. Проверка

1. Проверка переменных:

```bash
npm run launch:env:strict
```

2. Полный launch-gate:

```bash
npm run launch:check
```

3. Staging E2E smoke:

```bash
STAGING_BASE_URL="https://<staging-domain>" \
STAGING_TRACKING_API_KEY="<tracking-key>" \
STAGING_REFERRAL_CODE="<affiliate-referral-code>" \
STAGING_ADMIN_USER_ID="<admin-user-id>" \
STAGING_ADMIN_EMAIL="<admin-email>" \
STAGING_ADMIN_PASSWORD="<admin-password>" \
npm run staging:dry-run
```

## 6. Критерий закрытия блокера

- `launch:env:strict` проходит без missing/placeholder/invalid.
- `launch:check` проходит полностью.
- `staging:dry-run` проходит полным сценарием (включая admin segment).
