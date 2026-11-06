-- Additive pricing, cost snapshot and reporting fields.
--
-- This migration does not backfill historic costs or invent event dates. It
-- only widens money columns and snapshots the tax configuration that was in
-- effect for each existing order where the recorded tax amount proves the
-- prices were tax-exclusive.

ALTER TABLE "product_variant"
  ALTER COLUMN "costPrice" TYPE numeric(18, 2);

ALTER TABLE "order_item"
  ALTER COLUMN "costPrice" TYPE numeric(18, 2);

ALTER TABLE "order_item"
  ADD COLUMN "costSource" text,
  ADD COLUMN "costCapturedAt" timestamp(3);

ALTER TABLE "order"
  ADD COLUMN "pricesIncludeTax" boolean NOT NULL DEFAULT true,
  ADD COLUMN "taxRatePercent" numeric(5, 2) NOT NULL DEFAULT 0;

-- Existing orders with recorded tax were produced when prices were
-- tax-exclusive (the previous code only calculated tax in that mode). This is
-- derived from recorded data, not a fabricated tax breakdown.
UPDATE "order"
SET "pricesIncludeTax" = false
WHERE "taxAmount" > 0;

ALTER TABLE "return_request"
  ADD COLUMN "shippingRefundAmount" numeric(18, 2) NOT NULL DEFAULT 0;

ALTER TABLE "return_item"
  ADD COLUMN "restockToStock" boolean NOT NULL DEFAULT false,
  ADD COLUMN "damaged" boolean NOT NULL DEFAULT false,
  ADD COLUMN "salesAdjustmentAmount" numeric(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "costAdjustmentAmount" numeric(18, 2) NOT NULL DEFAULT 0;

-- The old RESTOCK intent already meant "put the goods back on the shelf".
UPDATE "return_item"
SET "restockToStock" = true
WHERE "restockOrRefund" = 'RESTOCK';

ALTER TABLE "refund"
  ADD COLUMN "returnRequestId" text;

CREATE UNIQUE INDEX "refund_returnRequestId_key"
  ON "refund"("returnRequestId");

ALTER TABLE "refund"
  ADD CONSTRAINT "refund_returnRequestId_fkey"
  FOREIGN KEY ("returnRequestId") REFERENCES "return_request"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Reporting reads sales by delivery date and returns by approval date.
CREATE INDEX "order_currency_deliveredAt_idx"
  ON "order"("currency", "deliveredAt");

CREATE INDEX "return_request_status_reviewedAt_idx"
  ON "return_request"("status", "reviewedAt");

CREATE INDEX "refund_status_refundedAt_idx"
  ON "refund"("status", "refundedAt");

CREATE INDEX "payment_status_paidAt_idx"
  ON "payment"("status", "paidAt");

ALTER TABLE "order_item"
  ADD COLUMN "allocationVersion" integer NOT NULL DEFAULT 0;

ALTER TABLE "return_item"
  ADD COLUMN "allocationVersion" integer NOT NULL DEFAULT 0;
