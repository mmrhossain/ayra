-- Catalog search indexes.
--
-- The product list `search` filter compiles (via Prisma) to
--   name ILIKE '%term%' OR slug ILIKE '%term%'
-- which cannot use a B-tree index and degrades to a sequential scan as the
-- catalog grows. pg_trgm GIN indexes make those ILIKE scans index-backed.
--
-- Postgres updates these indexes transactionally on every write, so no
-- background projector or worker is needed to keep search consistent.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS product_name_trgm_live_idx
  ON public.product USING gin (name gin_trgm_ops)
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS product_slug_trgm_live_idx
  ON public.product USING gin (slug gin_trgm_ops)
  WHERE "deletedAt" IS NULL;

-- Variant SKU is resolved by exact / prefix lookups during product writes
-- (case-insensitive). A trigram index keeps those prefix scans fast too.
CREATE INDEX IF NOT EXISTS product_variant_sku_trgm_live_idx
  ON public.product_variant USING gin (sku gin_trgm_ops)
  WHERE "deletedAt" IS NULL;

-- Admin order search.
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
