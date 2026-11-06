-- Geography reference codes for addresses, order snapshots, and shipping zones.
-- Codes come from the Bangladesh geography reference service; names stay as the
-- display/fallback value so historical addresses keep working during rollout.

ALTER TABLE "address"
  ADD COLUMN IF NOT EXISTS "divisionCode" TEXT,
  ADD COLUMN IF NOT EXISTS "districtCode" TEXT,
  ADD COLUMN IF NOT EXISTS "upazilaCode" TEXT;

ALTER TABLE "order_address"
  ADD COLUMN IF NOT EXISTS "divisionCode" TEXT,
  ADD COLUMN IF NOT EXISTS "districtCode" TEXT,
  ADD COLUMN IF NOT EXISTS "upazilaCode" TEXT;

ALTER TABLE "shipment_address"
  ADD COLUMN IF NOT EXISTS "divisionCode" TEXT,
  ADD COLUMN IF NOT EXISTS "districtCode" TEXT,
  ADD COLUMN IF NOT EXISTS "upazilaCode" TEXT;

ALTER TABLE "shipping_zone"
  ADD COLUMN IF NOT EXISTS "matchDistrictCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "address_districtCode_idx"
  ON "address" ("districtCode");

CREATE INDEX IF NOT EXISTS "order_address_districtCode_idx"
  ON "order_address" ("districtCode");
