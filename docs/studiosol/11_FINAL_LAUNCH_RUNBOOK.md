# StudioSol Referral — Final Launch Runbook

Дата: **2 апреля 2026**

## 1. Staging Final Check

1. Скопировать шаблон переменных:

```bash
cp .env.launch.example .env.local
```

2. Сгенерировать секреты:

```bash
npm run launch:secrets
```

3. Заполнить в `.env.local` реальные staging значения:

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TRACKING_ALLOWED_ORIGINS`
- `WEBHOOK_SECRET`

4. Прогнать env-gate:

```bash
npm run launch:env:strict
```

5. Прогнать полный quality/security gate:

```bash
npm run launch:check
```

6. Прогнать staging E2E smoke:

```bash
STAGING_BASE_URL="https://<staging-domain>" \
STAGING_TRACKING_API_KEY="<tracking-key>" \
STAGING_REFERRAL_CODE="<affiliate-referral-code>" \
STAGING_ADMIN_USER_ID="<admin-user-id>" \
STAGING_ADMIN_EMAIL="<admin-email>" \
STAGING_ADMIN_PASSWORD="<admin-password>" \
npm run staging:dry-run
```

## 2. Production Rollout

1. Перенести проверенные значения в production secret manager.
2. Выполнить deploy release-ветки.
3. Прогнать post-deploy smoke (те же dry-run проверки на production-safe test affiliate).
4. Проверить:

- отсутствие 5xx в `/api/track/*` и `/api/webhook/*`;
- корректность событий `conversion_duplicate` / `conversion_unattributed` / `conversion_attributed`;
- доступность admin/affiliate dashboard.

## 3. Go / No-Go

Go только если:

- `launch:env:strict` ✅
- `launch:check` ✅
- `staging:dry-run` ✅
- post-deploy smoke ✅

No-Go если любой пункт выше упал.

## 4. Rollback Trigger

Откат релиза обязателен при:

- массовых 5xx на tracking/webhook endpoints;
- нарушении идемпотентности conversion событий;
- некорректных payout статусах (`APPROVED -> PAID`) или отрицательных балансов не по policy.
