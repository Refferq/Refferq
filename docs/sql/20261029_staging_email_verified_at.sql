-- Herbal Vitaly Affiliate staging schema change. Apply only to the isolated Neon staging project.
-- Do not run against Shopify or any unrelated database.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);
