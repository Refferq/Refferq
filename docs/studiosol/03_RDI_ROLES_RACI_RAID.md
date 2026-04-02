# RDI, Roles, RACI, RAID

## 1. RDI Framework (для этого проекта)

`RDI = Requirements -> Design -> Implementation`

1. Requirements
- Фиксируем продуктовые и финансовые правила (что считается конверсией, когда начислять, когда платить).

2. Design
- Проектируем state machine, event contracts, security model, отчетность.

3. Implementation
- Пишем код по фазам, с тестами и критериями приемки, без "большого взрыва".

## 2. Роли

1. Product Owner (StudioSol founder)
- Владеет бизнес-правилами и KPI.

2. Tech Lead / Architect
- Владеет архитектурой, безопасностью, quality gates.

3. Backend Engineer
- API, event processing, комиссии, выплаты, интеграции.

4. Frontend Engineer
- Кабинеты admin/affiliate, UX, отчёты.

5. QA Engineer
- Test strategy, regression, e2e критичных потоков.

6. Finance/Ops
- Регламенты выплат, сверки, контроль ошибок начислений.

7. Legal/Compliance (part-time)
- Условия программы, privacy, оферты и налоговые требования.

## 3. RACI Matrix

| Workstream | Product Owner | Tech Lead | Backend | Frontend | QA | Finance/Ops | Legal |
|---|---|---|---|---|---|---|---|
| PRD и правила комиссий | A | C | C | I | I | C | C |
| Архитектура и security модель | C | A | R | C | C | I | C |
| Tracking API и webhook processing | I | C | A/R | I | C | I | I |
| Комиссии и payout engine | C | C | A/R | I | C | C | I |
| Admin/affiliate UI | C | C | C | A/R | C | I | I |
| Тестовая стратегия и quality gates | I | C | C | C | A/R | I | I |
| Финансовая сверка и отчёты | I | I | C | I | C | A/R | I |
| Terms/Privacy/политики | C | I | I | I | I | C | A/R |

Legend: `R` Responsible, `A` Accountable, `C` Consulted, `I` Informed.

## 4. RAID Register (стартовый)

## Risks

1. Неконсистентная атрибуция (дубли/потери событий).
- Mitigation: idempotency keys, replay-safe handlers, event log.

2. Ошибки в расчётах комиссий.
- Mitigation: детерминированный расчетный модуль + regression тесты + аудит.

3. Fraud/self-referral abuse.
- Mitigation: антифрод-правила, velocity checks, ручная ревизия high-risk.

4. Security debt из open-source baseline.
- Mitigation: hardening sprint перед production.

## Assumptions

- StudioSol может стабильно отправлять payment events.
- Условия реферальной программы юридически согласованы до launch.

## Issues

- В текущем репозитории нет зрелого тестового контура.
- Линт и часть quality checks не нормализованы.

## Dependencies

- Источник truth по оплатам (PSP/CRM/биллинг).
- Почтовый провайдер и доменная репутация.
- Финансовые процессы на стороне StudioSol.
