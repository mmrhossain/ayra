-- Admin order search compiles to case-insensitive `contains` filters on the
-- order number, customer name, and address name/phone. Those ILIKE scans
-- cannot use B-tree indexes, so add trigram GIN indexes. The order id filter
-- is an exact match and already uses the primary key.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS order_number_trgm_idx
  ON "order" USING gin ("orderNumber" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS order_address_phone_trgm_idx
  ON "order_address" USING gin (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS order_address_fullname_trgm_idx
  ON "order_address" USING gin ("fullName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS user_name_trgm_idx
  ON "user" USING gin (name gin_trgm_ops);

-- Admin lists only read live orders and always sort newest first, optionally
-- filtered by status. Partial indexes keep those scans small.
CREATE INDEX IF NOT EXISTS order_active_created_idx
  ON "order" ("createdAt" DESC) WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS order_active_status_created_idx
  ON "order" (status, "createdAt" DESC) WHERE "deletedAt" IS NULL;
