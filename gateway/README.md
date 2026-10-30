# Herbal Vitaly — Public Webhook Gateway (STAGING)

This project is a **separate public Vercel project**, not a public dashboard. It only exposes:
- `GET /api/health` — configuration flags only, no credentials
- `POST /api/shopify` — Shopify signed order events
- `POST /api/bosta` — Bosta authorized delivery events

The original Refferq Admin site remains Vercel Authentication protected. No automation bypass tokens are shared with Shopify or Bosta.

## Important: fail-closed until manual credentials are set

The gateway is deployed with `INGEST_ENABLED=false`. Do not enable until the below are verified. All write attempts will return HTTP 503 while disabled.

### 1. SQL-only Neon role (already created, locked)
The role `hv_gateway_limited` **already exists, is NOLOGIN**, has zero memberships, can write only `hv_cod_orders` and `hv_cod_events`, and has no access to users/payouts/commissions. This is intentional. Do not create it again.

**Do not use a Neon API/Console-created role** (Neon grants those `neon_superuser`). When ready, activate this existing limited role **in the Neon SQL Editor** with a strong unique password managed privately:

```sql
ALTER ROLE hv_gateway_limited WITH LOGIN PASSWORD '<strong-random-secret>';
```


Verify it has **zero** memberships and cannot access users/commissions/payouts:

```sql
SELECT
  has_table_privilege('hv_gateway_limited','hv_cod_orders','INSERT') AS can_ingest_order,
  has_table_privilege('hv_gateway_limited','hv_cod_events','INSERT') AS can_ingest_event,
  has_table_privilege('hv_gateway_limited','users','SELECT') AS can_read_users,
  has_table_privilege('hv_gateway_limited','payouts','INSERT') AS can_write_payouts,
  has_table_privilege('hv_gateway_limited','commissions','UPDATE') AS can_change_commissions,
  (SELECT COUNT(*) FROM pg_auth_members WHERE member='hv_gateway_limited'::regrole) AS memberships;
```

Expected: true,true,false,false,false,0. **Never** install Neon admin or owner credentials in this public project. In the gateway Vercel project, add `GATEWAY_DATABASE_URL` as an encrypted **Production** environment variable with this restricted role's URL. The project is named staging but its stable Vercel endpoint has Production target.

### 2. Vendor authentication
In **herbal-vitaly-webhook-gateway-staging** Vercel environment variables:
- `SHOPIFY_WEBHOOK_SECRET`: the Shopify Admin legacy webhook shared signing secret (Sensitive; Production target).
- `SHOPIFY_SHOP_DOMAIN`: `kk20pd-es.myshopify.com` (Production).
- `BOSTA_WEBHOOK_KEY`: the value configured in Bosta's Authorization Key field, not its Full Access API key (Sensitive; Production).
- `GATEWAY_DATABASE_URL`: only SQL-created limited-role URI (Sensitive; Production).
- `INGEST_ENABLED`: keep `false` until authenticated smoke tests are complete.

Neither the Bosta nor Shopify URL should contain any Vercel automation bypass query parameter. This project has no dashboard and intentionally allows authenticated webhooks through public endpoints.

### 3. Switch vendor URLs only after positive authentication tests
- Shopify `orders/create`, `orders/updated`, `orders/cancelled` → `https://<gateway-host>/api/shopify`.
- Bosta Webhook → `https://<gateway-host>/api/bosta`, Authorization key name `x-hv-bosta-key`. Retain the same **Authorization Key** value.
- The previous webhook endpoints on protected Refferq Preview should be disabled/edited to prevent failed or duplicate sends.
- Use stable project domain, not an immutable deployment hostname, so deployments can update without resetting webhooks.

### 4. Validation
- Confirm `GET /api/health` returns `ingestEnabled:false` initially.
- Unauthenticated/invalid HMAC Shopify and invalid Bosta keys must return 401 once enabled.
- Valid signed synthetic event must be recorded **once**, repeat should return duplicate.
- `hv_cod_events` stores only event IDs, order reference and state — not full customer details.
- Existing COD reconciliation UI reads `hv_cod_orders`.
- Bosta references must match Shopify order names, and Bosta schema must match the tested event fields.
- Merchant remittance stays a separate administrator proof check; gateway never approves commissions or makes payouts.

### Safety / limitations
- Payload limit: 256 KiB; non-JSON or unsupported currencies are rejected.
- This receiver stores a 20% **indicative** preview only, never a commission ledger entry.
- The current integration accepts Shopify orders via legacy webhook header HMAC and Bosta via a shared header key. Bosta webhook body schema and retry policy should be checked against a controlled real payload before switching the live vendor endpoints.
- Avoid posting secrets in tickets, chat or screenshots.


## Shopify discount codes → Refferq coupons (NEW)

- 20 existing Shopify codes were imported into the Refferq **staging** `coupons` table on 2026-10-30; source: `SHOPIFY`. No affiliate ID is assigned and no commission or payout is created.
- Codes remain **read-only in Refferq**; edit the underlying discount in Shopify. Only Shopify-owned coupon rows can be updated by synchronization; Refferq-owned coupons are left unchanged.
- Sync endpoint: `GET /api/discount-sync` (automated by Vercel Cron at `0 4 * * *` UTC, daily because account is Hobby).
- The synchronization is deliberately disabled with `SHOPIFY_DISCOUNT_SYNC_ENABLED=false` until Shopify Admin credentials have been installed and verified. It does not affect `INGEST_ENABLED` (COD webhooks).
- Create and install an app in Shopify **Dev Dashboard** with the minimal permission `read_discounts` for the store `kk20pd-es.myshopify.com`.
- In this *staging gateway* Vercel project, add encrypted **Production** environment variables `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET`. Client-credentials grant tokens expire after 24 hours; this cron obtains a new token on each run. Do not paste or store an expiring access token in the code.
- Enable `SHOPIFY_DISCOUNT_SYNC_ENABLED=true` only after credentials and a manual authenticated dry run have been checked. Redeploy to apply.
- `CRON_SECRET` is already set; the endpoint checks the bearer header using constant-time comparison.
- The limited PostgreSQL role `hv_gateway_limited` has SELECT on `coupons` and column-limited INSERT/UPDATE of the Shopify mirror fields, with **no UPDATE on `affiliate_id`** and no access to commissions or payouts.
- Sync scans the complete Shopify discount list before changing rows. Deleted/absent Shopify codes are deactivated rather than deleted. Missing code-pagination support is treated as a failed sync, not as an incomplete successful sync.
- Discounts with product-specific, quantity, customer, or stacking restrictions are shown as a summary only; Refferq must **not** be treated as Shopify's discount validation authority.
