BEGIN;
CREATE TABLE "tax_class" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "rate" DECIMAL(5,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "tax_class_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tax_class_rate_check" CHECK ("rate" >= 0 AND "rate" <= 100)
);
CREATE UNIQUE INDEX "tax_class_code_key" ON "tax_class"("code");
ALTER TABLE "product" ADD COLUMN "taxClassId" TEXT;
CREATE INDEX "product_taxClassId_idx" ON "product"("taxClassId");
ALTER TABLE "product" ADD CONSTRAINT "product_taxClassId_fkey" FOREIGN KEY ("taxClassId") REFERENCES "tax_class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_item" ADD COLUMN "taxClassName" TEXT, ADD COLUMN "taxRate" DECIMAL(5,2);
-- Carry the configured rate forward without changing existing prices or orders.
INSERT INTO "tax_class" ("id", "name", "code", "rate")
SELECT 'legacy-tax-class', 'Migrated VAT', 'LEGACY_VAT',
  CASE WHEN jsonb_typeof(value::jsonb) = 'number'
    THEN LEAST(100, GREATEST(0, (value::text)::numeric)) ELSE 0 END
FROM "platform_setting" WHERE key = 'checkout.taxRatePercent';
UPDATE "product" SET "taxClassId" = 'legacy-tax-class'
WHERE EXISTS (SELECT 1 FROM "tax_class" WHERE id = 'legacy-tax-class');
INSERT INTO "platform_setting" (id, key, value, "isSecret", "createdAt", "updatedAt")
VALUES ('tax-enabled-setting', 'checkout.taxEnabled', 'true', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('tax-display-setting', 'checkout.showTaxAtCheckout', 'true', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;
-- Historical item snapshots remain nullable; existing order-level reporting
-- fallbacks continue to use the original saved amounts and rates.
COMMIT;
