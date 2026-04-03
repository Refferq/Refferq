# Finish Line Recommendations (from engineering side)

Дата: **3 апреля 2026**

Ниже рекомендации для сильной "упаковки" проекта к запуску и на первые 30 дней работы.

## 1. Упаковка для команды и подрядчиков

1. Один "главный" индекс документов (`docs/studiosol/README.md`) как точка входа.
2. Отдельный "handoff package" для Bitrix-разработчика:
   - задача,
   - контракт,
   - тест-кейсы,
   - контакты владельцев.
3. Чёткий SLA по инцидентам и владельцам реакции.

## 2. Упаковка для бизнеса

1. Зафиксировать payout policy в одном документе и не менять без версии.
2. Зафиксировать definition "валидной конверсии".
3. Вынести спорные кейсы (refund, частичный возврат, отмена) в регламент.
4. Создать простую weekly dashboard страницу для руководителя:
   - revenue,
   - conversion,
   - refunds,
   - payouts due.

## 3. Упаковка для production reliability

1. Обязательный correlation id на каждом событии.
2. Retry queue + dead-letter log.
3. Сверка Bitrix vs Refferq по `order_id` раз в день.
4. Авто-alert на рост `ERROR` статусов синка.

## 4. Что я бы сделал сразу после запуска

1. Запустил 2 недели hypercare с ежедневным review.
2. Провёл audit партнёров:
   - кто даёт качественные лиды,
   - кто генерирует high refund rate.
3. Включил простую градацию офферов по качеству трафика.
4. Подготовил этап 2:
   - cohort analytics,
   - anti-fraud scoring,
   - partner tiering.

## 5. Минимальный backlog на next sprint

1. Интеграционные e2e тесты Bitrix -> Refferq (sandbox).
2. Автоматическая daily reconciliation job.
3. Дашборд "integration health" в админке.
4. Шаблон инцидент-репорта для финансовых расхождений.
