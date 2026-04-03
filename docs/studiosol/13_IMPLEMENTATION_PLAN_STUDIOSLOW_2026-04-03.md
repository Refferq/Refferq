# План реализации для studioslow.ru (Refferq-based)

Дата: **3 апреля 2026**
Ветка исполнения: `codex/studiosol-phase1-execution`

## 1. Контекст и цель

Цель: запустить реферальную программу `studioslow.ru` на базе Refferq с управляемым контуром:

`клик/код -> конверсия оплаты -> комиссия -> выплата -> аудит и отчётность`.

План ниже учитывает текущее состояние репозитория и уже выполненные launch-gates в тестовом окружении.

## 2. Актуальный baseline (что уже есть)

1. `npm run check` проходит (lint/typecheck/test/build).
2. `npm run audit:prod` проходит (0 vulnerabilities).
3. `npm run launch:env:strict` проходит при заполненном `.env.local`.
4. `npm run launch:gate` проходит в тестовом локальном dry-run контуре.
5. Есть рабочие скрипты:
   - `launch:gate`
   - `launch:check`
   - `staging:dry-run`
   - `launch:env:strict`
6. Исправлены критичные проблемы MVP-контура:
   - idempotency conversion/webhook;
   - корректность auto payout transition;
   - fallback `/api/auth/me` по cookie `auth-token`;
   - dev OTP flow для неблокирующего тестирования;
   - дефолты валюты под RUB сценарий.

## 3. Целевой scope запуска studioslow.ru (Launch Scope)

В scope запуска:

1. Один production бренд (`studioslow.ru`), одна основная валюта (`RUB`).
2. Server-side verified conversion events как источник финансового учёта.
3. Partner/admin кабинеты, комиссии, hold policy, batch payouts.
4. Почта на домене `studioslow.ru` для OTP и транзакционных писем.
5. Базовая наблюдаемость (ошибки, ключевые бизнес-счётчики, аудит).

Out of scope до запуска:

1. Multi-brand / multi-tenant режим.
2. Сложные антифрод-модели (ML scoring).
3. Продвинутые BI-интеграции beyond MVP.

## 4. Роли и ответственность (RACI-lite)

1. Product Owner (StudioSlow): правила комиссий, payout policy, Go/No-Go.
2. Tech Lead: архитектура, security gates, релизные решения.
3. Backend: tracking/webhook/contracts/commission/payout logic.
4. Frontend: admin/affiliate UX, статусы и отчёты.
5. QA: интеграционные и UAT сценарии, регрессия.
6. Finance/Ops: payout сверка, операционный регламент.
7. Legal/Compliance: оферта, условия выплат, privacy.

## 5. Технический стек запуска

1. App: Next.js 16 + TypeScript.
2. Data: PostgreSQL + Prisma migrations.
3. Email: Resend с доменной аутентификацией (`service@studioslow.ru`).
4. Security: JWT + webhook secret + tracking API key + CORS allowlist.
5. Operations: launch scripts (`launch:gate`, `staging:dry-run`), Docker Compose для локального стенда.

## 6. Фазовый план реализации

## Фаза A — Production Foundation (3-5 апреля 2026)

Цель: подготовить production-ready инфраструктурный минимум.

Deliverables:

1. Production/staging secret sets в секрет-хранилище (не в файлах).
2. Подтверждённые домены/поддомены:
   - `app.studioslow.ru` (или выбранный portal domain),
   - email identity для Resend.
3. Значения env для launch:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `TRACKING_ALLOWED_ORIGINS`
   - `WEBHOOK_SECRET`
   - `CRON_SECRET`
   - `OTP_DEV_MODE=0`
4. Проверка `npm run launch:env:strict` на staging-конфиге.

Gate:

1. Нет placeholder/пустых env.
2. OTP email уходит на доменную почту.
3. Секреты не хранятся в git.

## Фаза B — StudioSlow Integration (6-10 апреля 2026)

Цель: подключить реальный источник событий оплат от studioslow.ru.

Deliverables:

1. Event contract between StudioSlow backend and Refferq:
   - `event_id`, `order_id`, `occurred_at`, `amount`, `currency`, `referralCode`.
2. Интеграция server-side отправки:
   - `/api/track/conversion`
   - `/api/webhook/conversion` (если используется webhook-модель).
3. Политика идемпотентности и retry со стороны отправителя.
4. Mapping таблица статусов платежа -> статусы conversion/commission.

Gate:

1. Дубликаты не создают двойных комиссий.
2. Неатрибутированные события логируются отдельно.
3. В тестовом прогоне есть полный цикл на реальных тестовых заказах.

## Фаза C — Finance & Policy Hardening (11-14 апреля 2026)

Цель: финализировать финансовые правила перед запуском.

Deliverables:

1. Утверждённая комиссия:
   - ставка/правила,
   - hold period,
   - `minPayoutCents`,
   - payout frequency.
2. Refund/clawback policy формализована и проверена.
3. Reconciliation процедура:
   - payments vs conversions vs commissions vs payouts.
4. Права доступа и audit-требования для финансовых операций.

Gate:

1. Finance/Ops подтверждает корректность расчётов.
2. Все ручные корректировки идут через audit trail.

## Фаза D — UAT, Launch Gate, Go-Live (15-18 апреля 2026)

Цель: провести управляемый запуск с rollback-ready сценарием.

Deliverables:

1. UAT набор для admin/affiliate.
2. Финальный запуск gate-команд:
   - `npm run launch:check`
   - `npm run launch:env:strict`
   - `npm run staging:dry-run`
   - `npm run launch:gate`
3. Production rollout runbook + rollback checklist.
4. Hypercare план на первые 72 часа.

Gate:

1. Все launch-команды зелёные на staging.
2. Production smoke успешен.
3. Назначены on-call ответственные и канал эскалации.

## 7. Workstreams и бэклог до запуска

## WS1. Product/Policy

1. Зафиксировать MVP-правила начисления (когда именно создаётся комиссия).
2. Зафиксировать спорные кейсы (partial refund, delayed payment, cancelled order).
3. Утвердить партнёрские ToS и payout terms.

## WS2. Integration/API

1. Описать финальный JSON contract от StudioSlow backend.
2. Добавить contract tests на payload aliases/валидацию.
3. Подготовить отдельный API key для production tracking.

## WS3. Auth & Email

1. Подключить доменную почту (`service@studioslow.ru`) в Resend.
2. Проверить OTP flow в non-dev режиме (без fallback `[DEV OTP]`).
3. Подготовить процедуру admin-access recovery.

## WS4. Data & Ops

1. Выполнить `db:migrate` на staging/production.
2. Подготовить seed/bootstrap admin пользователя и test affiliate.
3. Формализовать резервное копирование БД и restore drill.

## WS5. QA & Monitoring

1. Обязательный e2e сценарий `referral -> conversion -> payout`.
2. Наблюдаемость: 5xx, latency p95, duplicate/rejected/unattributed counters.
3. Регрессия на auth, payouts, currency display (RUB).

## 8. Release gates (Definition of Done for Launch)

Launch разрешён только при выполнении всех пунктов:

1. Quality: `check` green.
2. Security: `audit:prod` без high/critical.
3. Env: `launch:env:strict` green для staging/prod профиля.
4. Integration: dry-run на staging с реальными staging keys.
5. Finance sign-off: подтверждена сверка и payout policy.
6. Legal sign-off: утверждены Terms/Privacy/affiliate conditions.
7. Rollback readiness: описан и проверен порядок отката.

## 9. Риски и меры снижения

1. Риск: несходимость событий оплаты и комиссий.
   Мера: source-of-truth на server-side events + reconciliation отчёт ежедневно.
2. Риск: проблемы с OTP/email deliverability.
   Мера: SPF/DKIM/DMARC + fallback admin login procedure.
3. Риск: неверные payout суммы.
   Мера: pre-release finance dry run + manual approval step.
4. Риск: CORS/secret misconfiguration.
   Мера: обязательный `launch:env:strict` + ограниченный origin allowlist.

## 10. Календарь до запуска (предложение)

1. 3-5 апреля 2026: Фаза A.
2. 6-10 апреля 2026: Фаза B.
3. 11-14 апреля 2026: Фаза C.
4. 15-18 апреля 2026: Фаза D + go-live window.

Итог: реалистичное окно управляемого запуска MVP — **до 18 апреля 2026**, если не появятся внешние блокеры по интеграции платежных событий и legal.

## 11. Что делать прямо сейчас (следующие 48 часов)

1. Зафиксировать production/staging домены и email identity.
2. Перенести все secrets в secret manager и прогнать `launch:env:strict`.
3. Согласовать финальный event contract со стороной studioslow backend.
4. Прогнать staging `launch:gate` уже на реальном staging URL (не localhost).
