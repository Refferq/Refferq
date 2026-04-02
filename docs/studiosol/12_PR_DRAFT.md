# PR Draft — Harden Referral Flows and Launch Readiness

## Title

feat: harden referral flows and finalize launch readiness

## Summary

This PR hardens referral tracking and payout flows for production readiness:

- standardizes conversion event contract (`event_id`, `order_id`, `occurred_at`) with snake/camel aliases
- enforces replay-safe idempotency for track/webhook conversion flows
- adds event-processing telemetry (`conversion_duplicate`, `conversion_rejected`, `conversion_unattributed`, `conversion_attributed`)
- improves audit actor safety for system-triggered webhook actions
- strengthens payout and financial API consistency
- migrates middleware to Next.js 16 `proxy.ts`
- upgrades chart typing compatibility with `recharts` v3
- adds launch automation scripts and docs (`launch:check`, env validation, staging dry-run, secrets generation)
- adds integration tests for idempotency and auto-payout correctness

## Validation

- `npm run check` ✅
- `npm run audit:prod` ✅
- `npm run test:integration` ✅ (with local integration PostgreSQL)
- `npm run staging:dry-run` ✅ (full scenario validated on local stand-in environment)

## Key Docs

- `docs/studiosol/08_READINESS_REPORT_2026-04-02.md`
- `docs/studiosol/11_FINAL_LAUNCH_RUNBOOK.md`
- `docs/studiosol/10_ENV_PROVISIONING_PLAYBOOK.md`

## Remaining Go-Live Blocker

- production/staging env secrets still need to be provisioned and validated with `npm run launch:env:strict`.
