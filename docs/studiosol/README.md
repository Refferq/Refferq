# StudioSol Referral Program — Project Docs Pack

Этот пакет документов предназначен для запуска реферальной программы StudioSol на базе репозитория Refferq.

## Состав

1. `01_REPOSITORY_DUE_DILIGENCE.md` — техническая оценка текущего состояния репозитория.
2. `02_PRD_STUDIOSOL_REFERRAL.md` — PRD (Product Requirements Document) для StudioSol.
3. `03_RDI_ROLES_RACI_RAID.md` — RDI-цикл, роли, зоны ответственности, риски.
4. `04_TECH_STACK_ARCHITECTURE.md` — целевая архитектура и стек.
5. `05_IMPLEMENTATION_ROADMAP.md` — этапный план внедрения, критерии приемки, KPI.
6. `06_PHASE_EXECUTION_TRACKER.md` — трекер исполнения по фазам, эпикам и gate-критериям.
7. `07_LAUNCH_CHECKLIST.md` — prelaunch/go-live/rollback чеклист запуска.
8. `08_READINESS_REPORT_2026-04-02.md` — текущий readiness-статус, блокеры и next block.
9. `09_STAGING_DRY_RUN_PROTOCOL.md` — протокол staging dry run и автоматизированный сценарий.
10. `10_ENV_PROVISIONING_PLAYBOOK.md` — playbook заполнения env/secrets и закрытия launch env-gate.
11. `11_FINAL_LAUNCH_RUNBOOK.md` — финальный one-shot runbook для staging финализации и production rollout.
12. `12_PR_DRAFT.md` — черновик PR для фиксации выполненных launch hardening изменений.
13. `13_IMPLEMENTATION_PLAN_STUDIOSLOW_2026-04-03.md` — актуальный пофазный план реализации для `studioslow.ru` до go-live.
14. `14_STUDIOSLOW_EVENT_CONTRACT.md` — финальный server-side контракт событий для интеграции StudioSlow -> Refferq.
15. `15_READINESS_REPORT_2026-04-03.md` — свежий readiness-статус с закрытыми техническими gate и оставшимися внешними блокерами.
16. `16_LAUNCH_EVIDENCE_PROTOCOL.md` — протокол генерации формального launch evidence отчёта.

## Как использовать

1. Согласовать PRD и модель комиссий.
2. Утвердить архитектурные решения (источник событий оплаты, холд-период, антифрод).
3. Запустить Phase 0/1 из roadmap как MVP.
4. По итогам MVP пересчитать KPI и перейти к Phase 2.

## Ключевой вывод

Refferq можно использовать как сильный стартовый ускоритель, но перед production-запуском для StudioSol требуется hardening (тесты, безопасность, стабильность API, миграции, операционные практики).
