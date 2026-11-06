/*
  Warnings:

  - A unique constraint covering the columns `[provider,externalEventId]` on the table `courier_webhook_log` will be added. If there are existing duplicate values, this will fail.
  - Made the column `externalEventId` on table `courier_webhook_log` required. This step will fail if there are existing NULL values in that column.
  - Made the column `externalEventId` on table `payment_webhook_log` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "blog_slug_idx";

-- DropIndex
DROP INDEX "blog_category_slug_idx";

-- DropIndex
DROP INDEX "cart_customerProfileId_idx";

-- DropIndex
DROP INDEX "cart_item_cartId_idx";

-- DropIndex
DROP INDEX "cms_page_slug_idx";

-- DropIndex
DROP INDEX "coupon_code_idx";

-- DropIndex
DROP INDEX "coupon_status_idx";

-- DropIndex
DROP INDEX "coupon_usage_couponId_idx";

-- DropIndex
DROP INDEX "customer_profile_customerCode_idx";

-- DropIndex
DROP INDEX "inventory_warehouseId_idx";

-- DropIndex
DROP INDEX "notification_template_code_idx";

-- DropIndex
DROP INDEX "order_customerProfileId_idx";

-- DropIndex
DROP INDEX "order_status_idx";

-- DropIndex
DROP INDEX "order_address_orderId_idx";

-- DropIndex
DROP INDEX "payment_webhook_log_provider_idx";

-- DropIndex
DROP INDEX "product_collection_slug_idx";

-- DropIndex
DROP INDEX "review_productId_idx";

-- DropIndex
DROP INDEX "shipping_rate_shippingZoneId_idx";

-- DropIndex
DROP INDEX "stock_reservation_orderId_idx";

-- DropIndex
DROP INDEX "variant_attribute_variantId_idx";

-- DropIndex
DROP INDEX "vendor_profile_shopSlug_idx";

-- DropIndex
DROP INDEX "warehouse_code_idx";

-- AlterTable
ALTER TABLE "courier_webhook_log" ALTER COLUMN "externalEventId" SET NOT NULL;

-- AlterTable
ALTER TABLE "payment_webhook_log" ALTER COLUMN "externalEventId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "courier_webhook_log_provider_externalEventId_key" ON "courier_webhook_log"("provider", "externalEventId");

-- CreateIndex
CREATE INDEX "shipment_warehouseId_idx" ON "shipment"("warehouseId");
