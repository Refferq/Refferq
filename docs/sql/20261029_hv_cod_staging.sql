-- Apply only to Neon herbal-vitaly-affiliate-staging / affiliate_staging.
-- No existing Refferq orders, commissions, payouts or Shopify store are changed.
CREATE TABLE IF NOT EXISTS hv_cod_orders (
  id text PRIMARY KEY,
  "shopifyOrderId" text NOT NULL UNIQUE,
  "orderName" text NOT NULL UNIQUE,
  currency text NOT NULL DEFAULT 'EGP',
  "subtotalPiasters" integer NOT NULL,
  "orderTotalPiasters" integer NOT NULL,
  "commissionPreviewPiasters" integer NOT NULL,
  "referralCode" text,
  "isCod" boolean NOT NULL DEFAULT false,
  cancelled boolean NOT NULL DEFAULT false,
  refunded boolean NOT NULL DEFAULT false,
  "shopifyUpdatedAt" timestamp(3) NOT NULL,
  "bostaDeliveryId" text,
  "bostaTrackingNumber" text,
  "bostaState" integer,
  "bostaUpdatedAt" timestamp(3),
  delivered boolean NOT NULL DEFAULT false,
  "courierCollected" boolean NOT NULL DEFAULT false,
  "collectedPiasters" integer NOT NULL DEFAULT 0,
  "merchantReconciled" boolean NOT NULL DEFAULT false,
  "merchantSettlementReference" text,
  "merchantSettledAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT NOW(),
  "updatedAt" timestamp(3) NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS hv_cod_events (
  id text PRIMARY KEY,
  "dedupeKey" text NOT NULL UNIQUE,
  source text NOT NULL,
  "orderName" text NOT NULL,
  state text NOT NULL,
  "occurredAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hv_cod_events_order_name_idx ON hv_cod_events("orderName");
