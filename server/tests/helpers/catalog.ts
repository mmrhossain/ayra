import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma.ts";
import type { CleanupTracker } from "./tracker.ts";

export const getOrCreateWarehouse = async (tracker: CleanupTracker) => {
  const existing = await prisma.warehouse.findFirst({
    where: { isActive: true, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  const warehouse = await prisma.warehouse.create({
    data: {
      name: "Test Warehouse",
      code: `WH-TEST-${randomUUID().slice(0, 8)}`,
      country: "Bangladesh",
      city: "Dhaka",
      addressLine1: "1 Test Road",
      isActive: true,
    },
  });
  tracker.warehouseIds.push(warehouse.id);
  return warehouse;
};

export const createTestProduct = async (
  tracker: CleanupTracker,
  opts?: {
    stock?: number;
    price?: number;
    compareAtPrice?: number;
    costPrice?: number;
    sku?: string;
    isFeatured?: boolean;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  }
) => {
  const tag = randomUUID().slice(0, 8);
  const category = await prisma.category.create({
    data: {
      name: `Test Cat ${tag}`,
      slug: `test-cat-${tag}`,
      isActive: true,
    },
  });
  tracker.categoryIds.push(category.id);

  const product = await prisma.product.create({
    data: {
      name: `Test Product ${tag}`,
      slug: `test-product-${tag}`,
      status: opts?.status ?? "ACTIVE",
      isFeatured: opts?.isFeatured ?? false,
      categoryId: category.id,
    },
  });
  tracker.productIds.push(product.id);

  const variant = await prisma.productVariant.create({
    data: {
      sku: opts?.sku ?? `SKU-${tag}`,
      price: opts?.price ?? 100,
      compareAtPrice: opts?.compareAtPrice ?? null,
      costPrice: opts?.costPrice ?? null,
      isDefault: true,
      productId: product.id,
    },
  });
  tracker.variantIds.push(variant.id);

  const warehouse = await getOrCreateWarehouse(tracker);
  const stock = opts?.stock ?? 10;
  const inventory = await prisma.inventory.create({
    data: {
      warehouseId: warehouse.id,
      variantId: variant.id,
      quantityOnHand: stock,
      quantityReserved: 0,
      quantityAvailable: stock,
    },
  });
  tracker.inventoryIds.push(inventory.id);

  return { category, product, variant, warehouse, inventory };
};

export const createActiveCartWithItem = async (
  tracker: CleanupTracker,
  customerProfileId: string,
  variant: { id: string; sku: string; price: unknown; productId: string },
  productName: string,
  quantity = 1
) => {
  const unitPrice = Number(variant.price);
  const cart = await prisma.cart.create({
    data: {
      customerProfileId,
      status: "ACTIVE",
      items: {
        create: {
          variantId: variant.id,
          productId: variant.productId,
          quantity,
          productName,
          sku: variant.sku,
          unitPrice,
          subtotal: unitPrice * quantity,
        },
      },
    },
  });
  tracker.cartIds.push(cart.id);
  return cart;
};
