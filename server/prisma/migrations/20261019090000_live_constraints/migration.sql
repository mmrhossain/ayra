-- Folds prisma/sql/live-constraints.sql and prisma/sql/search-indexes.sql into
-- the migration chain. Safe to apply to databases that already ran those scripts.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE UNIQUE INDEX IF NOT EXISTS product_slug_live_uidx
  ON public.product (slug) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS category_slug_live_uidx
  ON public.category (slug) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS brand_slug_live_uidx
  ON public.brand (slug) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS product_variant_sku_live_uidx
  ON public.product_variant (lower(sku)) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS product_variant_barcode_live_uidx
  ON public.product_variant (barcode) WHERE "deletedAt" IS NULL AND barcode IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_rating_range'
      AND conrelid = 'public.review'::regclass
  ) THEN
    ALTER TABLE public.review
      ADD CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS product_name_trgm_live_idx
  ON public.product USING gin (name gin_trgm_ops)
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS product_slug_trgm_live_idx
  ON public.product USING gin (slug gin_trgm_ops)
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS product_variant_sku_trgm_live_idx
  ON public.product_variant USING gin (sku gin_trgm_ops)
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS order_number_trgm_idx
  ON public."order" USING gin ("orderNumber" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS order_address_phone_trgm_idx
  ON public.order_address USING gin (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS order_address_fullname_trgm_idx
  ON public.order_address USING gin ("fullName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS user_name_trgm_idx
  ON public."user" USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS order_active_created_idx
  ON public."order" ("createdAt" DESC) WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS order_active_status_created_idx
  ON public."order" (status, "createdAt" DESC) WHERE "deletedAt" IS NULL;
