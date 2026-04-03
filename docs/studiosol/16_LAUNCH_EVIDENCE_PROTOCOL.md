# Launch Evidence Protocol

Дата: **3 апреля 2026**

## 1. Цель

Перед go-live получать единый артефакт (markdown отчёт) с фактом прохождения технических gate.

## 2. Команда

```bash
npm run launch:evidence
```

Результат: файл в `docs/studiosol/evidence/launch-evidence-<UTC>.md`.

## 3. Что проверяется

1. `npm run check`
2. `npm run audit:prod`
3. `npm run launch:env:strict`
4. `npm run launch:policy:strict`
5. `npm run staging:dry-run`

Опционально (дополнительная проверка контракта):

```bash
LAUNCH_INCLUDE_CONTRACT_SMOKE=1 npm run launch:evidence
```

## 4. Как использовать в Go/No-Go

1. Зафиксировать последний evidence-файл в обсуждении релиза.
2. Проверить, что все секции имеют `Exit code: 0`.
3. После этого проводить manual finance/legal sign-off.

