# Launch Evidence Report

- Generated (UTC): 2026-04-03T08-44-48Z
- Branch: `codex/studiosol-phase1-execution`
- Commit: `7c73194`

## Check (lint/test/build)

```bash
npm run check
```

```text

> refferq@1.1.0 check
> npm run lint && npm run test && npm run build


> refferq@1.1.0 lint
> npm run typecheck


> refferq@1.1.0 typecheck
> tsc --noEmit


> refferq@1.1.0 test
> tsx --test tests/*.test.ts tests/**/*.test.ts

✔ resolveTrackConversionIdempotency: prefers header key and normalizes values (17.43425ms)
✔ resolveTrackConversionIdempotency: returns nulls for empty or non-string values (1.089792ms)
✔ resolveWebhookConversionExternalIds: falls back to metadata ids (22.985833ms)
✔ resolveConversionEventContract: normalizes contract ids and occurred_at (2.275333ms)
✔ resolveConversionEventContract: falls back to metadata aliases and safe timestamp (0.753959ms)
✔ resolveWebhookConversionExternalIds: direct fields override metadata (0.202958ms)
✔ resolveConversionCorrelationIds: normalizes event/order/idempotency identifiers (0.2015ms)
✔ hasConversionCorrelationIds: requires at least one identifier (0.256ms)
﹣ integration: webhook conversion is idempotent for duplicate external event/order ids (5.113833ms) # SKIP
﹣ integration: track conversion rejects payloads without correlation identifiers (1.048417ms) # SKIP
﹣ integration: webhook conversion rejects payloads without event_id/order_id (0.217917ms) # SKIP
﹣ integration: auto payout marks approved commissions as paid and decrements balance (0.102125ms) # SKIP
✔ buildAutoPayoutPlan: returns payable affiliate when approved amount and balance are valid (8.865167ms)
✔ buildAutoPayoutPlan: skips affiliate when approved total is below threshold (0.334541ms)
✔ buildAutoPayoutPlan: skips affiliate when approved total is higher than current balance (0.228584ms)
✔ normalizeCommissionRuleType: maps legacy FLAT to FIXED (49.190541ms)
✔ normalizeProgramSettingsPatch: maps aliases and normalizes values (19.129292ms)
✔ normalizeProgramSettingsPatch: mirrors minPayoutCents to minimumPayoutThreshold (0.346584ms)
✔ normalizeProgramSettingsPatch: validates invalid values (0.410333ms)
✔ smoke: test runner is configured (1.75425ms)
ℹ tests 20
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 4
ℹ todo 0
ℹ duration_ms 6537.331792

> refferq@1.1.0 build
> next build

▲ Next.js 16.2.2 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
Browserslist: browsers data (caniuse-lite) is 6 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
✓ Compiled successfully in 3.6min
  Running TypeScript ...
  Finished TypeScript in 6.0min ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/76) ...
  Generating static pages using 7 workers (19/76) 
  Generating static pages using 7 workers (38/76) 
  Generating static pages using 7 workers (57/76) 
✓ Generating static pages using 7 workers (76/76) in 8.4s
  Finalizing page optimization ...

Route (app)                              Revalidate  Expire
┌ ○ /                                            1h      1y
├ ○ /_not-found                                  1h      1y
├ ○ /admin                                       1h      1y
├ ○ /admin/api-analytics                         1h      1y
├ ○ /admin/api-keys                              1h      1y
├ ○ /admin/coupons                               1h      1y
├ ○ /admin/customers                             1h      1y
├ ƒ /admin/customers/[id]
├ ○ /admin/emails                                1h      1y
├ ○ /admin/invoices                              1h      1y
├ ○ /admin/partners                              1h      1y
├ ƒ /admin/partners/[id]
├ ○ /admin/payouts                               1h      1y
├ ○ /admin/program-settings                      1h      1y
├ ○ /admin/programs                              1h      1y
├ ○ /admin/reports                               1h      1y
├ ○ /admin/resources                             1h      1y
├ ○ /admin/settings                              1h      1y
├ ○ /admin/team                                  1h      1y
├ ○ /affiliate                                   1h      1y
├ ○ /affiliate/payouts                           1h      1y
├ ○ /affiliate/referrals                         1h      1y
├ ○ /affiliate/reports                           1h      1y
├ ○ /affiliate/resources                         1h      1y
├ ○ /affiliate/settings                          1h      1y
├ ƒ /api/admin/affiliates
├ ƒ /api/admin/affiliates/[id]
├ ƒ /api/admin/affiliates/batch
├ ƒ /api/admin/analytics
├ ƒ /api/admin/api-keys
├ ƒ /api/admin/api-usage
├ ƒ /api/admin/commissions/mature
├ ƒ /api/admin/coupons
├ ƒ /api/admin/dashboard
├ ƒ /api/admin/emails
├ ƒ /api/admin/emails/test
├ ƒ /api/admin/integration
├ ƒ /api/admin/integration/generate-key
├ ƒ /api/admin/invoices
├ ƒ /api/admin/partner-groups
├ ƒ /api/admin/payouts
├ ƒ /api/admin/payouts/auto
├ ƒ /api/admin/profile
├ ƒ /api/admin/programs
├ ƒ /api/admin/referrals
├ ƒ /api/admin/referrals/[id]
├ ƒ /api/admin/refunds
├ ƒ /api/admin/reports
├ ƒ /api/admin/reports/cohort
├ ƒ /api/admin/reports/email
├ ƒ /api/admin/resources
├ ƒ /api/admin/saved-reports
├ ƒ /api/admin/scheduled-reports
├ ƒ /api/admin/settings
├ ƒ /api/admin/settings/integration
├ ƒ /api/admin/settings/profile
├ ƒ /api/admin/team
├ ƒ /api/admin/transactions
├ ƒ /api/admin/webhooks
├ ƒ /api/affiliate/branding
├ ƒ /api/affiliate/generate-code
├ ƒ /api/affiliate/payouts
├ ƒ /api/affiliate/profile
├ ƒ /api/affiliate/referrals
├ ƒ /api/affiliate/resources
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/me
├ ƒ /api/auth/register
├ ƒ /api/auth/send-otp
├ ƒ /api/auth/verify-otp
├ ƒ /api/docs
├ ƒ /api/test/email
├ ƒ /api/track/conversion
├ ƒ /api/track/referral
├ ƒ /api/webhook/conversion
├ ƒ /api/webhook/refund
├ ○ /login                                       1h      1y
├ ƒ /r/[code]
└ ○ /register                                    1h      1y


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

- Exit code: `0`

## Audit (prod deps)

```bash
npm run audit:prod
```

```text

> refferq@1.1.0 audit:prod
> npm audit --omit=dev

found 0 vulnerabilities
```

- Exit code: `0`

## Env Gate (strict)

```bash
npm run launch:env:strict
```

```text

> refferq@1.1.0 launch:env:strict
> tsx scripts/validate-env.ts --strict

Launch env validation
Mode: strict
Checked files: /Users/kmrkzn/Workspace/Projects/SS_AFFSPA/.env.local, /Users/kmrkzn/Workspace/Projects/SS_AFFSPA/.env
✅ Environment looks launch-ready
```

- Exit code: `0`

## Policy Gate (strict)

```bash
npm run launch:policy:strict
```

```text

> refferq@1.1.0 launch:policy:strict
> tsx scripts/validate-program-policy.ts --strict

Program policy validation
Mode: strict
Expected currency: RUB
Min hold days: 14
Min payout cents: 100000
Allow auto-approve payouts: no
✅ Program policy looks launch-ready
```

- Exit code: `0`

## Staging Dry Run

```bash
npm run staging:dry-run
```

```text

> refferq@1.1.0 staging:dry-run
> tsx scripts/staging-dry-run.ts

❌ Staging dry run failed
Missing required environment variable: STAGING_BASE_URL
```

- Exit code: `1`

