-- Return window enforcement and duplicate-pending protection.
ALTER TABLE "order" ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- Backfill existing delivered orders so they keep a meaningful return window.
UPDATE "order" AS o
SET "deliveredAt" = COALESCE(
  (
    SELECT MAX(h."createdAt")
    FROM "order_status_history" AS h
    WHERE h."orderId" = o.id AND h.status = 'DELIVERED'
  ),
  o."createdAt"
)
WHERE o.status = 'DELIVERED' AND o."deliveredAt" IS NULL;

-- A return request is created and approved/rejected one at a time. Enforce the
-- "one pending request per order" rule in the database, not just in the
-- service, so concurrent submissions cannot both pass the existence check.
CREATE UNIQUE INDEX IF NOT EXISTS return_request_pending_order_uidx
  ON "return_request" ("orderId") WHERE status = 'PENDING';
