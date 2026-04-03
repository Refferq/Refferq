# Final Release Packaging — StudioSlow Referral

Дата: **3 апреля 2026**

Этот документ фиксирует финальную упаковку проекта перед production rollout.

## 1. Что должно быть "упаковано" к финалу

1. Продуктовая документация:
   - PRD
   - Бизнес-процессы
   - Роли и ответственность
2. Техническая документация:
   - Event contract
   - Runbook запуска
   - Env/secrets playbook
   - Protocol dry-run и evidence
3. Операционная документация:
   - Launch checklist
   - Rollback protocol
   - Incident SOP
4. Интеграционная документация:
   - Task для 1C-Битрикс разработчика
   - Definition of Done по интеграции

## 2. Артефакты релиза

- Код ветки: `codex/studiosol-phase1-execution`
- Теги/опорные коммиты rollback
- Отчёт readiness
- Launch evidence отчёт
- Актуальный список env variables

## 3. Финальная процедура перед go-live

1. Freeze окна изменений (кроме P1 fix).
2. Повторный `launch:gate` на staging.
3. Контрактный smoke (`staging:contract-smoke`).
4. Проверка UI и auth flow.
5. Проверка conversion/refund test events.
6. Подтверждение Finance/Operations.
7. Production rollout по runbook.
8. 24h hypercare мониторинг.

## 4. Rollback стратегия

### 4.1 Код/релиз

- Откат на предыдущий стабильный commit/tag.
- Проверка миграций (обратимость или compensation script).

### 4.2 Интеграции

- Временная пауза отправки внешних webhook events.
- Буферизация событий и replay после восстановления.

### 4.3 Коммуникация

- Внутренний incident channel.
- Статус обновлений каждые 30-60 минут до восстановления.

## 5. Hypercare (первые 7 дней)

- Метрики каждые 4 часа:
  - ошибки API (4xx/5xx),
  - retries,
  - объём conversion/refund,
  - число спорных комиссий.
- Ежедневный sync Product + Ops + Finance + Tech.

## 6. Exit criteria фазы запуска

- Нет критических P1/P0 инцидентов 72 часа.
- Conversion/refund обрабатываются в SLA.
- Расчёт комиссий корректен по выборочной сверке.
- Партнёры успешно получают выплаты по регламенту.
