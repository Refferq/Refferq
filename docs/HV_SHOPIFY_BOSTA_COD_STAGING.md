# Herbal Vitaly — Shopify / Bosta COD Connector (STAGING)

## Current status and safety boundary
- Shop verified by Shopify Admin GraphQL: `kk20pd-es.myshopify.com`, currency **EGP**.
- **Preview branch only.** No Shopify webhook subscription has been created and no Bosta webhook has been configured yet.
- New tables `hv_cod_orders`, `hv_cod_events`; existing `commissions`, `payouts` and affiliate balances remain untouched.
- Existing financial mutation guard remains enabled. No actual commission is approved or paid by these endpoints.
- The 20% commission preview uses **current_subtotal_price**, after discounts and before shipping/tax; confirm this commercial basis before activating actual commissions.

## Endpoint URLs
On the deployed Preview origin:
- `POST /api/integrations/shopify/orders`
- `POST /api/integrations/bosta/status`
- `GET /api/admin/cod/settlements` (authenticated admin)
- `POST /api/admin/cod/settlements` (authenticated admin + remittance evidence)

## Configuration required BEFORE live webhooks
1. Set `SHOPIFY_SHOP_DOMAIN=kk20pd-es.myshopify.com` (already set for this Preview branch).
2. Create/identify a Shopify app authorized to emit order notifications; add its shared `SHOPIFY_WEBHOOK_SECRET` as an encrypted Preview branch secret in Vercel. **Do not use the access token as HMAC secret.**
3. Register Shopify topics `orders/create`, `orders/updated`, `orders/cancelled` for the HTTPS endpoint only after testing; do not register it on production yet.
4. In Bosta dashboard, Settings → API Integration → Set Up Your Webhook, configure:
   - URL `https://<preview-domain>/api/integrations/bosta/status`
   - Authorization Key Name `x-hv-bosta-key`; value must match Vercel encrypted `BOSTA_WEBHOOK_KEY`. Do not share it in chat.
5. Ensure the **Bosta delivery businessReference exactly matches the Shopify order name** (example: `#HV-TEST-001`). Verify existing shipping integration populates this before enabling callback.
6. Courier-delivery status `45` plus confirmed delivery and reported COD amount only indicate courier collection. They **do not** establish Herbal Vitaly's bank/merchant remittance.
7. After checking independent remittance evidence (Bosta settlement statement/bank), an authenticated administrator may POST an amount and evidenceReference to `/api/admin/cod/settlements`. This only records a review; no commission or payout is created.

## Test suite
Build gates include:
- Shopify raw-body Base64 HMAC rejects tampering
- Bosta authorization rejects a different key
- EGP-to-piaster arithmetic is exact
- `1000.00 EGP` product subtotal, `1050.00 EGP` collected COD, `200.00 EGP` indicative commission
- Before merchant remittance: ineligible
- After confirmed remittance: eligible for **manual review only**
- No commission credited and no payment executed
- Undelivered/returned/refunded/cancelled/non-COD/no-attribution orders remain blocked

## Remaining before real usage
- Obtain Bosta authorization key and Shopify app webhook shared secret through secure Vercel settings.
- Configure, validate and monitor subscriptions (including retries and event ordering) on a controlled test store.
- Reconcile full/partial refunds and shipment replacements with immutable order-level settlement proof.
- Confirm commission base, shipping/taxes, discounts, COD charges, payout thresholds and exact disbursement evidence.
- Replace the existing financial mutation lock only after QA, reconciliation, idempotent payouts and approval review.
