# Refferq — Due Diligence для StudioSol

## 1. Executive Summary

Вердикт: **использовать можно, но не как "drop-in production"**.

Оценка текущей готовности (для прод-рефералки):

- Product completeness: `7/10`
- Engineering quality: `5/10`
- Security posture: `5/10`
- Operability (CI/CD, monitoring, runbooks): `4/10`
- Test maturity: `2/10`
- Итог: **`4.6/10` до hardening, `7.5+/10` после Phase 0-1**

## 2. Что в проекте уже хорошо

- Широкий функциональный охват домена affiliate/referral:
  - партнёры, рефералы, конверсии, комиссии, выплаты, отчётность.
- Современный прикладной стек:
  - Next.js App Router, TypeScript, Prisma, PostgreSQL.
- Есть модульная доменная структура и разделение admin/affiliate API.
- `npm run build` в локальной проверке проходит (проект компилируется).
- Есть Dockerfile и docker-compose для быстрого старта.

## 3. Критические и значимые пробелы

### 3.1 Тестирование и качество

- Автотесты отсутствуют (`*.test.*`/`*.spec.*` не найдены).
- `npm run lint` фактически нерабочий в текущей связке (`next lint` падает с ошибкой директории).
- В коде много обходов типов через `as any`, включая критические API-потоки.

Риск: высокий шанс регрессий при кастомизации под StudioSol.

### 3.2 Security и устойчивость

- `npm audit --omit=dev` показывает `6` уязвимостей (`4 high`, `2 moderate`).
- Трекинговые endpoint'ы используют wildcard CORS (`Access-Control-Allow-Origin: *`).
- API-ключи реализованы двумя разными подходами (`integrationSettings` и `api_keys`), что повышает шанс ошибок и misconfiguration.
- Для cookie-based auth нет полноценного CSRF-слоя для state-changing операций.

Риск: возможные abuse-сценарии и эксплуатационные инциденты после запуска.

### 3.3 Data и миграции

- В репозитории отсутствуют Prisma migrations как процесс (`prisma/migrations` не используется как источник истины).
- В репозитории присутствует `prisma/dev.db`.
- `package.json` содержит `db:seed`, но `prisma/seed.ts` отсутствует.

Риск: нестабильный rollout по средам, drift схемы и не воспроизводимые деплои.

### 3.4 Интеграционный контур и tracking

- `/api/track/referral` логирует клик, но не фиксирует полноценную запись атрибуции по консистентной модели.
- Нет явной idempotency-стратегии для конверсий (order/event deduplication).
- Нет явной state-machine документации по жизненному циклу referral/conversion/commission/payout.

Риск: расхождение учёта и финансовых расчётов.

### 3.5 Документация и управляемость

- Много "fix-summary" документов, часть устарела и противоречит текущему коду/версии.
- Нет единого "source of truth" по production-ready стандарту.

Риск: высокая когнитивная нагрузка, трудная поддержка.

## 4. Подходит ли Refferq для StudioSol

Да, как фундамент для ускорения, потому что:

- доменная модель близка к задаче;
- есть готовые UX-потоки и админка;
- есть базовая схема трекинга и выплат.

Но обязательно доработать до запуска:

1. Security hardening.
2. Тестовый контур (unit/integration/e2e).
3. Упрощение и унификация API key + tracking pipeline.
4. Миграционный процесс и data governance.
5. Наблюдаемость и операционные регламенты.

## 5. Рекомендуемое решение

- Принять стратегию: **"Fork + Hardening + StudioSol adaptation"**.
- Не запускать "как есть" в прод.
- Запускать через этапы из `05_IMPLEMENTATION_ROADMAP.md`.

## 6. Definition of Ready перед MVP production

Минимальный чеклист:

- [ ] Закрыты high vulnerabilities.
- [ ] Рабочий lint/typecheck/test в CI.
- [ ] Есть migrations + seed + rollback policy.
- [ ] Единая модель API key/auth для tracking APIs.
- [ ] Idempotency для conversion/refund событий.
- [ ] RLS/доступы и audit trail для финансовых операций.
- [ ] SLA/SLO и алертинг подключены.
