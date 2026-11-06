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
ALTER TABLE public.review ADD CONSTRAINT review_rating_range CHECK (rating BETWEEN 1 AND 5);
CREATE UNIQUE INDEX IF NOT EXISTS cart_one_active_per_customer_uidx
  ON public.cart ("customerProfileId") WHERE "status" = 'ACTIVE';
