-- Herbal Vitaly: Shopify discount code mirror. Never grants affiliate commissions.
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'REFFERQ',
  ADD COLUMN IF NOT EXISTS shopify_discount_id text,
  ADD COLUMN IF NOT EXISTS shopify_summary text,
  ADD COLUMN IF NOT EXISTS shopify_status text,
  ADD COLUMN IF NOT EXISTS shopify_synced_at timestamp without time zone;
CREATE INDEX IF NOT EXISTS coupons_shopify_discount_id_idx ON coupons (shopify_discount_id);
CREATE INDEX IF NOT EXISTS coupons_source_idx ON coupons (source);
