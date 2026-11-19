import { AppError } from "../../common/errors/AppError.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import { prisma, transaction, type TransactionClient } from "../../lib/prisma.ts";
import { getDefaultWarehouse } from "../catalog/inventory/services/inventory.service.ts";
import { applyCouponAtomic, calculateCouponPricingForRecord, listAvailableCoupons } from "../coupon/coupon.service.ts";
import type { CouponContext } from "../coupon/types.ts";
import { fromMinor, toMinor } from "../order/utils/order-helpers.ts";
import { calculateTaxTotals } from "../tax/tax-calculation.ts";
import { getTaxClasses } from "../tax/tax.service.ts";
import { getSettingValue } from "../settings/settings.service.ts";
import type { CartLineCreate, CartLineUpdate, GuestCartItem } from "./types.ts";

const availableAtDefaultWarehouse = async (tx: TransactionClient, variantId: string) => {
  const rows = await tx.$queryRaw<Array<{ quantityAvailable: number }>>`
    SELECT i."quantityAvailable"
    FROM "inventory" i
    WHERE i."variantId" = ${variantId}
      AND i."warehouseId" = (
        SELECT id
        FROM "warehouse"
        WHERE "isActive" = true AND "deletedAt" IS NULL
        ORDER BY "createdAt" ASC
        LIMIT 1
      )
    LIMIT 1
  `;
  return rows[0]?.quantityAvailable ?? 0;
};

const cartImagesArgs = {
  select: { imageUrl: true, isPrimary: true },
  orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
};

const variantCartInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      images: cartImagesArgs,
    },
  },
} as const;

export const cartInclude = {
  items: {
    include: {
      variant: {
        select: {
          id: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          attributes: {
            select: {
              attributeValue: {
                select: {
                  value: true,
                  attribute: { select: { name: true } },
                },
              },
            },
          },
          product: {
            select: {
              id: true,
              taxClassId: true,
              categoryId: true,
              name: true,
              slug: true,
              status: true,
              images: cartImagesArgs,
            },
          },
        },
      },
    },
  },
  coupon: true,
  activities: { orderBy: { createdAt: "desc" as const }, take: 5 },
} as const;

type CartImageRow = { imageUrl: string; isPrimary: boolean };

const isUsableImageUrl = (url: string | null | undefined): url is string =>
  Boolean(url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")));

const firstImageUrl = (images?: CartImageRow[] | null): string | null => {
  if (!images?.length) return null;
  const url = images.find((img) => img.isPrimary)?.imageUrl || images[0]?.imageUrl;
  return isUsableImageUrl(url) ? url : null;
};

const resolveCartItemImage = (item: {
  productImage?: string | null;
  variant?: {
    product?: { images?: CartImageRow[] } | null;
  } | null;
}): string | null => {
  if (isUsableImageUrl(item.productImage)) return item.productImage;
  return firstImageUrl(item.variant?.product?.images);
};

const hydrateCartImages = <
  T extends {
    items: Array<{
      productImage: string | null;
      variant?: {
        product?: { images?: CartImageRow[] } | null;
      } | null;
    }>;
  } | null,
>(
  cart: T
): T => {
  if (!cart) return cart;
  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      productImage: resolveCartItemImage(item),
    })),
  };
};

const loadCart = async (db: TransactionClient | typeof prisma, cartId: string) => {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
  return summarizeCart(db, cart);
};

export const getActiveCart = async (customerProfileId: string) => {
  const cart = await prisma.cart.findFirst({
    where: { customerProfileId, status: "ACTIVE" },
    include: cartInclude,
  });
  return summarizeCart(prisma, cart);
};

const lockActiveCart = async (tx: TransactionClient, customerProfileId: string) => {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "cart"
    WHERE id IN (
      SELECT id FROM "cart"
      WHERE "customerProfileId" = ${customerProfileId} AND status = 'ACTIVE'
      ORDER BY "createdAt" ASC
      LIMIT 1
    )
    FOR UPDATE`;
  return rows[0] ?? null;
};

const getOrCreateLockedCart = async (tx: TransactionClient, customerProfileId: string) => {
  const locked = await lockActiveCart(tx, customerProfileId);
  if (locked) return locked;

  try {
    return await tx.cart.create({
      data: { customerProfileId, status: "ACTIVE" },
      select: { id: true },
    });
  } catch {
    const raced = await lockActiveCart(tx, customerProfileId);
    if (!raced) throw new AppError("Unable to create cart", 500);
    return raced;
  }
};

export const getOrCreateActiveCart = async (customerProfileId: string) => {
  const existing = await getActiveCart(customerProfileId);
  if (existing) return existing;

  try {
    return hydrateCartImages(
      await prisma.cart.create({
        data: { customerProfileId, status: "ACTIVE" },
        include: cartInclude,
      })
    );
  } catch (err) {
    const raced = await getActiveCart(customerProfileId);
    if (raced) return raced;
    throw err;
  }
};

// Current prices and reference data are recalculated for each response.
// Legacy cart total columns remain in the schema but are not a totals cache.
const summarizeCart = async (
  db: TransactionClient | typeof prisma,
  cart: Prisma.CartGetPayload<{ include: typeof cartInclude }> | null,
) => {
  if (!cart) return null;
  const items = cart.items.map(item => ({
    ...item,
    unitPrice: item.variant.price,
    subtotal: fromMinor(toMinor(item.variant.price) * item.quantity),
  }));
  const subtotal = fromMinor(items.reduce((sum, item) => sum + toMinor(item.subtotal), 0));
  let discountAmount = 0;
  let discountEligible: boolean[] = [];
  let coupon = cart.coupon;
  let freeShipping = false;
  if (coupon) {
    const record = await db.coupon.findFirst({ where: { code: coupon.couponCode, deletedAt: null } });
    if (record && record.isActive && record.status === "ACTIVE" && record.startsAt <= new Date() && record.expiresAt >= new Date() &&
      (record.minimumOrderAmount === null || toMinor(subtotal) >= toMinor(record.minimumOrderAmount)) &&
      (record.usageLimit === null || record.usageCount < record.usageLimit)) {
      freeShipping = record.discountType === "FREE_SHIPPING";
      try {
        const pricing = await calculateCouponPricingForRecord(db, record, {
          subtotal,
          productIds: items.map(item => item.productId),
          productCategoryIds: items.map(item => item.variant.product.categoryId),
          lines: items.map(item => ({ productId: item.productId, categoryId: item.variant.product.categoryId, subtotal: item.subtotal })),
        });
        discountAmount = pricing.discountAmount;
        discountEligible = pricing.discountEligible;
      } catch (error) {
        if (!(error instanceof AppError) || error.statusCode >= 500) throw error;
        coupon = null;
        freeShipping = false;
      }
    } else coupon = null;
  }
  const [taxEnabled, classes] = await Promise.all([
    getSettingValue<boolean>("checkout.taxEnabled"),
    getTaxClasses(),
  ]);
  const { allocations: _allocations, ...totals } = calculateTaxTotals(
    items.map((item, index) => ({ unitPrice: item.variant.price, quantity: item.quantity, taxClassId: item.variant.product.taxClassId, discountEligible: discountEligible[index] ?? true })),
    discountAmount, classes, { taxEnabled },
  );
  return hydrateCartImages({
    ...cart, ...totals, items, freeShipping,
    coupon: coupon ? { ...coupon, discountAmount } : null
  });
};

export const getCart = async (customerProfileId: string) => {
  const cart = await getActiveCart(customerProfileId);
  if (!cart) {
    return {
      items: [],
      coupon: null,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      shippingAmount: 0,
      grandTotal: 0,
    };
  }
  return cart;
};

export const addItem = async (customerProfileId: string, variantId: string, quantity: number) => {
  return transaction(async (tx) => {
    const variant = await tx.productVariant.findFirst({
      where: { id: variantId, deletedAt: null, product: { deletedAt: null } },
      include: variantCartInclude,
    });

    if (!variant) throw new AppError("Variant not found", 404);
    if (variant.product.status !== "ACTIVE") {
      throw new AppError("Product is not available", 409);
    }

    const available = await availableAtDefaultWarehouse(tx, variantId);
    if (available < quantity) throw new AppError("Insufficient stock available", 409);

    const cart = await getOrCreateLockedCart(tx, customerProfileId);

    const existingItem = await tx.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (available < newQuantity) {
        throw new AppError("Insufficient stock available", 409);
      }

      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          subtotal: Number(existingItem.unitPrice) * newQuantity,
        },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: variant.productId,
          variantId,
          quantity,
          productImage: firstImageUrl(variant.product.images),
          productName: variant.product.name,
          productSlug: variant.product.slug,
          sku: variant.sku,
          unitPrice: Number(variant.price),
          subtotal: Number(variant.price) * quantity,
        },
      });
    }

    await tx.cartActivity.create({
      data: {
        cartId: cart.id,
        eventType: "ITEM_ADDED",
        metadata: { variantId, quantity },
      },
    });

    return loadCart(tx, cart.id);
  });
};

export const updateItemQuantity = async (
  customerProfileId: string,
  variantId: string,
  quantity: number
) => {
  return transaction(async (tx) => {
    const cart = await lockActiveCart(tx, customerProfileId);
    if (!cart) throw new AppError("Cart not found", 404);

    const item = await tx.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    if (!item) throw new AppError("Item not in cart", 404);

    const available = await availableAtDefaultWarehouse(tx, variantId);
    if (available < quantity) throw new AppError("Insufficient stock available", 409);

    await tx.cartItem.update({
      where: { id: item.id },
      data: { quantity, subtotal: Number(item.unitPrice) * quantity },
    });

    await tx.cartActivity.create({
      data: {
        cartId: cart.id,
        eventType: "QUANTITY_CHANGED",
        metadata: { variantId, quantity },
      },
    });

    return loadCart(tx, cart.id);
  });
};

export const removeItem = async (customerProfileId: string, variantId: string) => {
  return transaction(async (tx) => {
    const cart = await lockActiveCart(tx, customerProfileId);
    if (!cart) throw new AppError("Cart not found", 404);

    const item = await tx.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    if (!item) throw new AppError("Item not in cart", 404);

    await tx.cartItem.delete({ where: { id: item.id } });

    await tx.cartActivity.create({
      data: {
        cartId: cart.id,
        eventType: "ITEM_REMOVED",
        metadata: { variantId },
      },
    });

    return loadCart(tx, cart.id);
  });
};

export const clearCart = async (customerProfileId: string) => {
  return transaction(async (tx) => {
    const cart = await lockActiveCart(tx, customerProfileId);
    if (!cart) return null;

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cartCoupon.deleteMany({ where: { cartId: cart.id } });

    return loadCart(tx, cart.id);
  });
};

const couponCartInclude = {
  items: {
    include: {
      variant: {
        select: { price: true, product: { select: { categoryId: true } } },
      },
    },
  },
} as const;

const getCouponContext = (items: Prisma.CartGetPayload<{ include: typeof couponCartInclude }>["items"]): CouponContext => {
  const lines = items.map(item => ({
    productId: item.productId,
    categoryId: item.variant.product.categoryId,
    subtotal: Number(item.variant.price) * item.quantity,
  }));
  return {
    subtotal: lines.reduce((sum, line) => sum + line.subtotal, 0),
    productIds: lines.map(line => line.productId),
    productCategoryIds: lines.map(line => line.categoryId),
    lines,
  };
};

export const getAvailableCartCoupons = async (customerProfileId: string) => {
  const cart = await prisma.cart.findFirst({
    where: { customerProfileId, status: "ACTIVE" },
    include: couponCartInclude,
  });
  return cart?.items.length ? listAvailableCoupons(customerProfileId, getCouponContext(cart.items)) : [];
};

export const applyCoupon = async (customerProfileId: string, code: string) => {
  return transaction(async (tx) => {
    const locked = await lockActiveCart(tx, customerProfileId);
    if (!locked) throw new AppError("Cart is empty", 400);
    const cart = await tx.cart.findUniqueOrThrow({
      where: { id: locked.id },
      include: couponCartInclude,
    });
    if (cart.items.length === 0) throw new AppError("Cart is empty", 400);

    const { coupon, discountAmount } = await applyCouponAtomic(
      code,
      customerProfileId,
      getCouponContext(cart.items),
      tx
    );

    await tx.cartCoupon.upsert({
      where: { cartId: cart.id },
      update: { couponCode: coupon.code, discountAmount },
      create: { cartId: cart.id, couponCode: coupon.code, discountAmount },
    });

    return loadCart(tx, cart.id);
  });
};

export const removeCoupon = async (customerProfileId: string) => {
  return transaction(async (tx) => {
    const cart = await lockActiveCart(tx, customerProfileId);
    if (!cart) return null;

    await tx.cartCoupon.deleteMany({ where: { cartId: cart.id } });

    return loadCart(tx, cart.id);
  });
};

// ==========================================
export const mergeGuestCart = async (customerProfileId: string, items: GuestCartItem[]) => {
  if (!items.length) {
    return getCart(customerProfileId);
  }

  const merged = await transaction(async (tx) => {
    const userCart = await getOrCreateLockedCart(tx, customerProfileId);

    const guestItems = items;
    const variantIds = [
      ...new Set(guestItems.map((item) => item.variantId).filter((id) => id.length > 0)),
    ];

    if (variantIds.length === 0) {
      return loadCart(tx, userCart.id);
    }

    const warehouse = await getDefaultWarehouse(tx);
    const variants = await tx.productVariant.findMany({
      where: {
        id: { in: variantIds },
        deletedAt: null,
        product: { deletedAt: null, status: "ACTIVE" },
      },
      include: variantCartInclude,
    });
    const inventories = warehouse
      ? await tx.inventory.findMany({
        where: {
          warehouseId: warehouse.id,
          variantId: { in: variantIds },
        },
        select: { variantId: true, quantityAvailable: true },
      })
      : [];
    const existingItems = await tx.cartItem.findMany({
      where: { cartId: userCart.id, variantId: { in: variantIds } },
    });

    const variantById = new Map(variants.map((variant) => [variant.id, variant]));
    const availableByVariant = new Map(
      inventories.map((row) => [row.variantId, row.quantityAvailable])
    );
    const existingByVariant = new Map(existingItems.map((item) => [item.variantId, item]));

    const qtyByVariant = new Map<string, number>();
    for (const guestItem of guestItems) {
      const variantId = guestItem.variantId as string;
      const requestedQty = Number(guestItem.quantity) || 0;
      if (!variantId || requestedQty <= 0) continue;
      qtyByVariant.set(variantId, (qtyByVariant.get(variantId) ?? 0) + requestedQty);
    }

    const itemUpdates: CartLineUpdate[] = [];
    const itemCreates: CartLineCreate[] = [];

    for (const [variantId, requestedQty] of qtyByVariant) {
      const variant = variantById.get(variantId);
      if (!variant) continue;

      const available = availableByVariant.get(variantId) ?? 0;
      if (available <= 0) continue;

      const existingItem = existingByVariant.get(variantId);

      if (existingItem) {
        const mergedQuantity = Math.min(existingItem.quantity + requestedQty, available);
        itemUpdates.push({
          id: existingItem.id,
          quantity: mergedQuantity,
          subtotal: Number(existingItem.unitPrice) * mergedQuantity,
        });
      } else {
        const finalQty = Math.min(requestedQty, available);
        itemCreates.push({
          cartId: userCart.id,
          productId: variant.productId,
          variantId,
          quantity: finalQty,
          productName: variant.product.name,
          productSlug: variant.product.slug,
          productImage: firstImageUrl(variant.product.images),
          sku: variant.sku,
          unitPrice: Number(variant.price),
          subtotal: Number(variant.price) * finalQty,
        });
      }
    }

    if (itemUpdates.length > 0) {
      const ids = itemUpdates.map((item) => item.id);
      const quantities = itemUpdates.map((item) => item.quantity);
      const subtotals = itemUpdates.map((item) => item.subtotal);
      await tx.$executeRaw`
        UPDATE "cart_item" AS c
        SET
          quantity = v.qty,
          subtotal = v.subtotal
        FROM unnest(
          ARRAY[${Prisma.join(ids)}]::text[],
          ARRAY[${Prisma.join(quantities)}]::int[],
          ARRAY[${Prisma.join(subtotals)}]::numeric[]
        ) AS v(id, qty, subtotal)
        WHERE c.id = v.id
      `;
    }

    if (itemCreates.length > 0) {
      await tx.cartItem.createMany({ data: itemCreates });
    }

    return loadCart(tx, userCart.id);
  });

  return merged;
};

export const quoteGuestCart = async (input: GuestCartItem[]) => {
  if (!input.length) return { items: [], subtotal: 0, discountAmount: 0, taxAmount: 0, shippingAmount: 0, grandTotal: 0 };
  const quantities = new Map<string, number>();
  for (const item of input) quantities.set(item.variantId, Math.min(999, (quantities.get(item.variantId) ?? 0) + item.quantity));
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: [...quantities.keys()] }, deletedAt: null, product: { deletedAt: null, status: "ACTIVE" } },
    select: { id: true, price: true, product: { select: { taxClassId: true } } },
  });
  const [taxEnabled, classes] = await Promise.all([
    getSettingValue<boolean>("checkout.taxEnabled"), getTaxClasses(),
  ]);
  const lines = variants.map(variant => ({ variantId: variant.id, unitPrice: Number(variant.price), quantity: quantities.get(variant.id)!, taxClassId: variant.product.taxClassId }));
  const { allocations: _allocations, ...totals } = calculateTaxTotals(lines, 0, classes, { taxEnabled });
  return { ...totals, items: lines.map(({ taxClassId: _taxClassId, ...line }) => ({ ...line, subtotal: fromMinor(toMinor(line.unitPrice) * line.quantity) })) };
};
