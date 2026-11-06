-- Enforce at most one ACTIVE cart per customer at the database level.
-- The application already serializes cart creation; this closes the direct
-- write/race gap and backs the cart service invariant.

CREATE UNIQUE INDEX IF NOT EXISTS "cart_one_active_per_customer_uidx"
  ON "cart" ("customerProfileId")
  WHERE "status" = 'ACTIVE';
