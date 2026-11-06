-- Product SKUs live on product_variant only; the product-level copy was unused.
ALTER TABLE "product" DROP COLUMN "sku";
