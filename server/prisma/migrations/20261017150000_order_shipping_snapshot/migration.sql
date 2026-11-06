-- Snapshot the shipping zone/rate used at checkout so historical orders survive config changes.
ALTER TABLE "order"
  ADD COLUMN "shippingZoneId" TEXT,
  ADD COLUMN "shippingZoneName" TEXT,
  ADD COLUMN "shippingZoneCode" TEXT,
  ADD COLUMN "shippingRateId" TEXT,
  ADD COLUMN "shippingRatePrice" DECIMAL(18, 2);
