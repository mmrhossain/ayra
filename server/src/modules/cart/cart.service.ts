import { prisma, transaction, type TransactionClient } from "../../lib/prisma.ts";
import { AppError } from "../../common/errors/AppError.ts";
import { applyCouponAtomic } from "../coupon/coupon.service.ts";
import { redisGet, redisSet, redisDel } from "../../lib/redis.ts";
import { getDefaultWarehouse } from "../catalog/inventory/services/inventory.service.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import type { CartLineCreate, CartLineUpdate, GuestCartData } from "./types.ts";

const availableAtDefaultWarehouse = async (
  tx: TransactionClient,
  variantId: string
) => {
  const rows = await tx.$queryRaw<Array<{ quantityAvailable: number }>>`
    SELECT i."quantityAvailable"
    FROM "Inventory" i
    WHERE i."variantId" = ${variantId}
      AND i."warehouseId" = (
        SELECT id
        FROM "Warehouse"
        WHERE "isActive" = true AND "deletedAt" IS NULL
        ORDER BY "createdAt" ASC
        LIMIT 1
      )
    LIMIT 1
  `;
  return rows[0]?.quantityAvailable ?? 0;
};

// Product prices already include VAT/tax (business decision). taxAmount is
// intentionally always 0 so a later change does not double-tax checkout.
const TAX_RATE = 0;

// Guest cart configuration
const GUEST_CART_PREFIX = "guest:cart:";
const GUEST_CART_TTL = 60 * 60 * 24 * 7; // 7 days expiration

export const cartInclude = {
  items: {
    include: {
      variant: {
        select: {
          id: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          product: { select: { id: true, name: true, slug: true, status: true } },
        },
      },
    },
  },
  coupon: true,
  activities: { orderBy: { createdAt: "desc" as const }, take: 5 },
} as const;

export const getActiveCart = async (customerProfileId: string) => {
  return prisma.cart.findFirst({
    where: { customerProfileId, status: "ACTIVE" },
    include: cartInclude,
  });
};

const lockActiveCart = async (
  tx: TransactionClient,
  customerProfileId: string,
) => {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Cart"
    WHERE id IN (
      SELECT id FROM "Cart"
      WHERE "customerProfileId" = ${customerProfileId} AND status = 'ACTIVE'
      ORDER BY "createdAt" ASC
      LIMIT 1
    )
    FOR UPDATE`;
  return rows[0] ?? null;
};

const getOrCreateLockedCart = async (
  tx: TransactionClient,
  customerProfileId: string,
) => {
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
    return await prisma.cart.create({
      data: { customerProfileId, status: "ACTIVE" },
      include: cartInclude,
    });
  } catch (err) {
    const raced = await getActiveCart(customerProfileId);
    if (raced) return raced;
    throw err;
  }
};

export const recalcCartTotals = async (
    tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    cartId: string
) => {
  const items = await tx.cartItem.findMany({ where: { cartId } });
  const coupon = await tx.cartCoupon.findUnique({ where: { cartId } });

  const subtotal = items.reduce((sum, i) => sum + Number(i.subtotal), 0);
  const discountAmount = coupon ? Number(coupon.discountAmount) : 0;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shippingAmount = 0;
  const grandTotal = subtotal - discountAmount + taxAmount + shippingAmount;

  return tx.cart.update({
    where: { id: cartId },
    data: { subtotal, discountAmount, taxAmount, shippingAmount, grandTotal },
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

export const addItem = async (
    customerProfileId: string,
    variantId: string,
    quantity: number
) => {
  return transaction(async (tx) => {
    const variant = await tx.productVariant.findFirst({
      where: { id: variantId, deletedAt: null, product: { deletedAt: null } },
      include: { product: { select: { id: true, name: true, slug: true, status: true } } },
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

    await recalcCartTotals(tx, cart.id);

    return tx.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
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

    await recalcCartTotals(tx, cart.id);

    return tx.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
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

    await recalcCartTotals(tx, cart.id);

    return tx.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
  });
};

export const clearCart = async (customerProfileId: string) => {
  return transaction(async (tx) => {
    const cart = await lockActiveCart(tx, customerProfileId);
    if (!cart) return null;

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cartCoupon.deleteMany({ where: { cartId: cart.id } });
    await recalcCartTotals(tx, cart.id);

    return tx.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
  });
};

export const applyCoupon = async (customerProfileId: string, code: string) => {
  return transaction(async (tx) => {
    const locked = await lockActiveCart(tx, customerProfileId);
    if (!locked) throw new AppError("Cart is empty", 400);
    const cart = await tx.cart.findUniqueOrThrow({
      where: { id: locked.id },
      include: {
        items: {
          include: {
            variant: {
              select: { product: { select: { categoryId: true } } },
            },
          },
        },
      },
    });
    if (cart.items.length === 0) throw new AppError("Cart is empty", 400);

    const productIds = cart.items.map((i) => i.productId);
    const productCategoryIds = cart.items.map(
      (item) => item.variant.product.categoryId,
    );
    const subtotal = cart.items.reduce((s, i) => s + Number(i.subtotal), 0);
    const lines = cart.items.map((item) => ({
      productId: item.productId,
      categoryId: item.variant.product.categoryId,
      subtotal: Number(item.subtotal),
    }));

    const { coupon, discountAmount } = await applyCouponAtomic(
        code,
        customerProfileId,
        { subtotal, productIds, productCategoryIds, lines },
        tx
    );

    await tx.cartCoupon.upsert({
      where: { cartId: cart.id },
      update: { couponCode: coupon.code, discountAmount },
      create: { cartId: cart.id, couponCode: coupon.code, discountAmount },
    });

    await recalcCartTotals(tx, cart.id);

    return tx.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
  });
};

export const removeCoupon = async (customerProfileId: string) => {
  return transaction(async (tx) => {
    const cart = await lockActiveCart(tx, customerProfileId);
    if (!cart) return null;

    await tx.cartCoupon.deleteMany({ where: { cartId: cart.id } });
    await recalcCartTotals(tx, cart.id);

    return tx.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });
  });
};

// ==========================================
// Guest Cart Operations (Powered by Redis)
// ==========================================

const emptyGuestCart = {
  items: [] as GuestCartData["items"],
  subtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  shippingAmount: 0,
  grandTotal: 0,
};

const guestCartKey = (sessionId: string) => `${GUEST_CART_PREFIX}${sessionId}`;

const parseGuestCartData = (raw: unknown): GuestCartData | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as GuestCartData;
  if (!Array.isArray(data.items)) return null;
  return data;
};

const loadGuestCartData = async (sessionId: string): Promise<GuestCartData | null> => {
  const cached = await redisGet(guestCartKey(sessionId));
  if (cached) {
    try {
      const parsed = parseGuestCartData(JSON.parse(cached));
      if (parsed) return parsed;
    } catch {
      // fall through to DB
    }
  }

  try {
    const row = await prisma.guestCart.findUnique({ where: { sessionId } });
    if (!row || row.expiresAt <= new Date()) return null;
    const parsed = parseGuestCartData(row.cartData);
    if (parsed) {
      await redisSet(guestCartKey(sessionId), JSON.stringify(parsed), GUEST_CART_TTL);
    }
    return parsed;
  } catch {
    return null;
  }
};

export const getGuestCart = async (sessionId: string) => {
  const cartData = await loadGuestCartData(sessionId);
  if (!cartData) return emptyGuestCart;
  return cartData;
};

export const saveGuestCart = async (sessionId: string, cartData: GuestCartData) => {
  const expiresAt = new Date(Date.now() + GUEST_CART_TTL * 1000);
  await redisSet(guestCartKey(sessionId), JSON.stringify(cartData), GUEST_CART_TTL);
  try {
    await prisma.guestCart.upsert({
      where: { sessionId },
      create: { sessionId, cartData, expiresAt },
      update: { cartData, expiresAt },
    });
  } catch {
    // Redis is the live guest cart; DB persist is best-effort.
  }
  return cartData;
};

export const mergeGuestCart = async (customerProfileId: string, sessionId: string) => {
  const guestCart = await loadGuestCartData(sessionId);
  if (!guestCart?.items?.length) {
    return getCart(customerProfileId);
  }

  const merged = await transaction(async (tx) => {
    const userCart = await getOrCreateLockedCart(tx, customerProfileId);

    const guestItems = Array.isArray(guestCart.items) ? guestCart.items : [];
    const variantIds = [
      ...new Set(guestItems.map((item) => item.variantId).filter((id) => id.length > 0)),
    ];

    if (variantIds.length === 0) {
      await recalcCartTotals(tx, userCart.id);
      return tx.cart.findUnique({
        where: { id: userCart.id },
        include: cartInclude,
      });
    }

    const warehouse = await getDefaultWarehouse(tx);
    const variants = await tx.productVariant.findMany({
      where: {
        id: { in: variantIds },
        deletedAt: null,
        product: { deletedAt: null, status: "ACTIVE" },
      },
      include: { product: { select: { id: true, name: true, slug: true, status: true } } },
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
    const existingByVariant = new Map(
      existingItems.map((item) => [item.variantId, item])
    );

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
        UPDATE "CartItem" AS c
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

    await recalcCartTotals(tx, userCart.id);

    return tx.cart.findUnique({
      where: { id: userCart.id },
      include: cartInclude,
    });
  });

  await redisDel(guestCartKey(sessionId));
  try {
    await prisma.guestCart.deleteMany({ where: { sessionId } });
  } catch {
    // Redis already cleared; DB cleanup is best-effort.
  }

  return merged;
};