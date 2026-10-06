import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { checkout } from "../../src/modules/order/services/order.service.ts";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  validateCouponCode,
} from "../../src/modules/coupon/coupon.service.ts";
import { createCouponSchema } from "../../src/modules/coupon/coupon.validator.ts";
import { AppError } from "../../src/common/errors/AppError.ts";
import {
  CleanupTracker,
  createActiveCartWithItem,
  createTestCoupon,
  createTestProduct,
  createTestUser,
  testAddress,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const checkoutWithCoupon = async (
  customerProfileId: string,
  couponCode: string
) => {
  return checkout(customerProfileId, {
    paymentMethod: "COD",
    billingAddress: testAddress,
    shippingMethodCode: "STANDARD",
    couponCode,
  });
};

describe("Coupon redemption", () => {
  it("allows exactly one success for usageLimit:1 under concurrent redemption", async () => {
    const coupon = await createTestCoupon(tracker, { usageLimit: 1 });
    const catalog = await createTestProduct(tracker, { stock: 20, price: 100 });

    const users = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        createTestUser(tracker, { suffix: `cp-${Date.now()}-${i}` })
      )
    );

    await Promise.all(
      users.map((u) =>
        createActiveCartWithItem(
          tracker,
          u.customerProfileId,
          catalog.variant,
          catalog.product.name,
          1
        )
      )
    );

    const results = await Promise.allSettled(
      users.map((u) => checkoutWithCoupon(u.customerProfileId, coupon.code))
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(4);

    for (const r of fulfilled) {
      if (r.status === "fulfilled") tracker.orderIds.push(r.value.id);
    }

    const updated = await prisma.coupon.findUniqueOrThrow({
      where: { id: coupon.id },
    });
    expect(updated.usageCount).toBe(1);

    const usages = await prisma.couponUsage.count({
      where: { couponId: coupon.id },
    });
    expect(usages).toBe(1);
  });

  it("rejects expired coupon", async () => {
    const user = await createTestUser(tracker, { suffix: `ex-${Date.now()}` });
    const coupon = await createTestCoupon(tracker, {
      startsAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      validateCouponCode(coupon.code, user.customerProfileId, {
        subtotal: 100,
        productIds: [],
        productCategoryIds: [],
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Coupon is not valid at this time",
    } satisfies Partial<AppError>);
  });

  it("enforces usageLimitPerCustomer of 1", async () => {
    const coupon = await createTestCoupon(tracker, { usageLimitPerCustomer: 1 });
    const catalog = await createTestProduct(tracker, { stock: 20, price: 100 });
    const user = await createTestUser(tracker, { suffix: `ul-${Date.now()}` });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const first = await checkoutWithCoupon(user.customerProfileId, coupon.code);
    tracker.orderIds.push(first.id);

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    await expect(
      checkoutWithCoupon(user.customerProfileId, coupon.code)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Coupon has already been used by this customer",
    } satisfies Partial<AppError>);
  });

  it("rejects applying the same coupon twice on one order", async () => {
    const coupon = await createTestCoupon(tracker);
    const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
    const user = await createTestUser(tracker, { suffix: `uq-${Date.now()}` });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const order = await checkoutWithCoupon(user.customerProfileId, coupon.code);
    tracker.orderIds.push(order.id);

    await expect(
      prisma.couponUsage.create({
        data: {
          couponId: coupon.id,
          customerProfileId: user.customerProfileId,
          orderId: order.id,
          discountAmount: 10,
        },
      })
    ).rejects.toThrow();
  });

  it("applies product-restricted coupon via CouponProduct join table", async () => {
    const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
    const coupon = await createTestCoupon(tracker, {
      productIds: [catalog.product.id],
    });
    const user = await createTestUser(tracker, { suffix: `jp-${Date.now()}` });

    await expect(
      validateCouponCode(coupon.code, user.customerProfileId, {
        subtotal: 100,
        productIds: [catalog.product.id],
        productCategoryIds: [catalog.category.id],
      })
    ).resolves.toMatchObject({ coupon: { id: coupon.id } });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const order = await checkoutWithCoupon(user.customerProfileId, coupon.code);
    tracker.orderIds.push(order.id);

    const usages = await prisma.couponUsage.count({
      where: { couponId: coupon.id, orderId: order.id },
    });
    expect(usages).toBe(1);
  });

  it("rejects product-restricted coupon when cart product is not in CouponProduct", async () => {
    const allowed = await createTestProduct(tracker, { stock: 5, price: 100 });
    const other = await createTestProduct(tracker, { stock: 5, price: 100 });
    const coupon = await createTestCoupon(tracker, {
      productIds: [allowed.product.id],
    });
    const user = await createTestUser(tracker, { suffix: `jpr-${Date.now()}` });

    await expect(
      validateCouponCode(coupon.code, user.customerProfileId, {
        subtotal: 100,
        productIds: [other.product.id],
        productCategoryIds: [other.category.id],
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Coupon is not applicable to the items in the cart",
    } satisfies Partial<AppError>);
  });

  it("applies category-restricted coupon via CouponCategory join table", async () => {
    const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
    const coupon = await createTestCoupon(tracker, {
      categoryIds: [catalog.category.id],
    });
    const user = await createTestUser(tracker, { suffix: `jc-${Date.now()}` });

    await expect(
      validateCouponCode(coupon.code, user.customerProfileId, {
        subtotal: 100,
        productIds: [catalog.product.id],
        productCategoryIds: [catalog.category.id],
      })
    ).resolves.toMatchObject({ coupon: { id: coupon.id } });
  });

  it("rejects category-restricted coupon when cart category is not in CouponCategory", async () => {
    const allowed = await createTestProduct(tracker, { stock: 5, price: 100 });
    const other = await createTestProduct(tracker, { stock: 5, price: 100 });
    const coupon = await createTestCoupon(tracker, {
      categoryIds: [allowed.category.id],
    });
    const user = await createTestUser(tracker, { suffix: `jcr-${Date.now()}` });

    await expect(
      validateCouponCode(coupon.code, user.customerProfileId, {
        subtotal: 100,
        productIds: [other.product.id],
        productCategoryIds: [other.category.id],
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Coupon is not applicable to the items in the cart",
    } satisfies Partial<AppError>);
  });

  it("discounts only matching lines for a product-restricted coupon", async () => {
    const allowed = await createTestProduct(tracker, { stock: 5, price: 100 });
    const other = await createTestProduct(tracker, { stock: 5, price: 80 });
    const coupon = await createTestCoupon(tracker, {
      productIds: [allowed.product.id],
      discountValue: 10,
    });
    const user = await createTestUser(tracker, { suffix: `rl-${Date.now()}` });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      allowed.variant,
      allowed.product.name,
      1
    );
    const cart = await prisma.cart.findFirstOrThrow({
      where: { customerProfileId: user.customerProfileId, status: "ACTIVE" },
    });
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: other.product.id,
        variantId: other.variant.id,
        quantity: 1,
        productName: other.product.name,
        sku: other.variant.sku,
        unitPrice: 80,
        subtotal: 80,
      },
    });

    const order = await checkoutWithCoupon(user.customerProfileId, coupon.code);
    tracker.orderIds.push(order.id);

    expect(Number(order.discountAmount)).toBe(10);
    expect(Number(order.subtotal)).toBe(180);
  });

  it("zeroes shipping for FREE_SHIPPING coupons", async () => {
    const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
    const coupon = await createTestCoupon(tracker, {
      discountType: "FREE_SHIPPING",
    });
    const user = await createTestUser(tracker, { suffix: `fs-${Date.now()}` });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const order = await checkoutWithCoupon(user.customerProfileId, coupon.code);
    tracker.orderIds.push(order.id);

    expect(Number(order.shippingAmount)).toBe(0);
    expect(Number(order.discountAmount)).toBe(0);
    expect(Number(order.grandTotal)).toBe(100);
  });

  it("rolls coupon usage back when an unpaid order is cancelled", async () => {
    const coupon = await createTestCoupon(tracker, { usageLimit: 1 });
    const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
    const user = await createTestUser(tracker, { suffix: `rb-${Date.now()}` });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const order = await checkoutWithCoupon(user.customerProfileId, coupon.code);
    tracker.orderIds.push(order.id);

    const before = await prisma.coupon.findUniqueOrThrow({
      where: { id: coupon.id },
    });
    expect(before.usageCount).toBe(1);

    const { cancelOrder } = await import(
      "../../src/modules/order/services/order.service.ts"
    );
    await cancelOrder(user.customerProfileId, order.id, "test rollback");

    const after = await prisma.coupon.findUniqueOrThrow({
      where: { id: coupon.id },
    });
    expect(after.usageCount).toBe(0);

    const usages = await prisma.couponUsage.count({
      where: { couponId: coupon.id },
    });
    expect(usages).toBe(0);
  });

  it("rejects inactive coupon", async () => {
    const user = await createTestUser(tracker, { suffix: `in-${Date.now()}` });
    const coupon = await createTestCoupon(tracker, {
      isActive: false,
      status: "DISABLED",
    });

    await expect(
      validateCouponCode(coupon.code, user.customerProfileId, {
        subtotal: 100,
        productIds: [],
        productCategoryIds: [],
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Coupon is not active",
    } satisfies Partial<AppError>);
  });
});

const couponWindow = () => {
  const now = Date.now();
  return {
    startsAt: new Date(now - 60_000),
    expiresAt: new Date(now + 24 * 60 * 60 * 1000),
  };
};

describe("Coupon admin create/update", () => {
  it("creates join rows and uppercases the code", async () => {
    const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
    const parsed = createCouponSchema.parse({
      code: "save-10",
      name: "Save ten",
      discountType: "PERCENTAGE",
      discountValue: 10,
      ...couponWindow(),
      applicableProductIds: [catalog.product.id],
      applicableCategoryIds: [catalog.category.id],
    });
    const coupon = await createCoupon(parsed);
    tracker.couponIds.push(coupon.id);

    expect(coupon.code).toBe("SAVE-10");
    expect(coupon.applicableProductIds).toEqual([catalog.product.id]);
    expect(coupon.applicableCategoryIds).toEqual([catalog.category.id]);

    const products = await prisma.couponProduct.findMany({
      where: { couponId: coupon.id },
    });
    const categories = await prisma.couponCategory.findMany({
      where: { couponId: coupon.id },
    });
    expect(products.map((row) => row.productId)).toEqual([catalog.product.id]);
    expect(categories.map((row) => row.categoryId)).toEqual([
      catalog.category.id,
    ]);
  });

  it("forces FREE_SHIPPING discountValue to 0", async () => {
    const parsed = createCouponSchema.parse({
      code: `FS${randomUUID().replace(/-/g, "").slice(0, 8)}`,
      name: "Free ship",
      discountType: "FREE_SHIPPING",
      discountValue: 25,
      ...couponWindow(),
    });
    const coupon = await createCoupon(parsed);
    tracker.couponIds.push(coupon.id);
    expect(coupon.discountValue.toNumber()).toBe(0);
  });

  it("rejects duplicate codes case-insensitively", async () => {
    const code = `DUP${randomUUID().replace(/-/g, "").slice(0, 7)}`;
    const first = await createCoupon(
      createCouponSchema.parse({
        code,
        name: "First",
        discountType: "FIXED_AMOUNT",
        discountValue: 5,
        ...couponWindow(),
      }),
    );
    tracker.couponIds.push(first.id);

    await expect(
      createCoupon(
        createCouponSchema.parse({
          code: code.toLowerCase(),
          name: "Second",
          discountType: "FIXED_AMOUNT",
          discountValue: 5,
          ...couponWindow(),
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Coupon code already exists",
    } satisfies Partial<AppError>);
  });

  it("rejects expiry that is not after start", async () => {
    const startsAt = new Date("2026-01-02T00:00:00.000Z");
    const expiresAt = new Date("2026-01-01T00:00:00.000Z");
    expect(() =>
      createCouponSchema.parse({
        code: "BAD-DATES",
        name: "Bad dates",
        discountType: "FIXED_AMOUNT",
        discountValue: 5,
        startsAt,
        expiresAt,
      }),
    ).toThrow();

    await expect(
      createCoupon({
        code: "BAD-DATES",
        name: "Bad dates",
        discountType: "FIXED_AMOUNT",
        discountValue: 5,
        status: "ACTIVE",
        isActive: true,
        startsAt,
        expiresAt,
        applicableProductIds: [],
        applicableCategoryIds: [],
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "expiresAt must be after startsAt",
    } satisfies Partial<AppError>);
  });

  it("keeps join tables when restriction fields are omitted on update", async () => {
    const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
    const coupon = await createCoupon(
      createCouponSchema.parse({
        code: `KEEP${randomUUID().replace(/-/g, "").slice(0, 6)}`,
        name: "Keep joins",
        discountType: "FIXED_AMOUNT",
        discountValue: 8,
        ...couponWindow(),
        applicableProductIds: [catalog.product.id],
        applicableCategoryIds: [catalog.category.id],
      }),
    );
    tracker.couponIds.push(coupon.id);

    const updated = await updateCoupon(coupon.id, { name: "Renamed coupon" });
    expect(updated.name).toBe("Renamed coupon");
    expect(updated.applicableProductIds).toEqual([catalog.product.id]);
    expect(updated.applicableCategoryIds).toEqual([catalog.category.id]);

    const products = await prisma.couponProduct.count({
      where: { couponId: coupon.id },
    });
    const categories = await prisma.couponCategory.count({
      where: { couponId: coupon.id },
    });
    expect(products).toBe(1);
    expect(categories).toBe(1);
  });

  it("replaces product restrictions when IDs are sent", async () => {
    const first = await createTestProduct(tracker, { stock: 5, price: 100 });
    const second = await createTestProduct(tracker, { stock: 5, price: 100 });
    const coupon = await createCoupon(
      createCouponSchema.parse({
        code: `SWAP${randomUUID().replace(/-/g, "").slice(0, 6)}`,
        name: "Swap products",
        discountType: "FIXED_AMOUNT",
        discountValue: 8,
        ...couponWindow(),
        applicableProductIds: [first.product.id],
      }),
    );
    tracker.couponIds.push(coupon.id);

    const updated = await updateCoupon(coupon.id, {
      applicableProductIds: [second.product.id],
    });
    expect(updated.applicableProductIds).toEqual([second.product.id]);

    const rows = await prisma.couponProduct.findMany({
      where: { couponId: coupon.id },
    });
    expect(rows.map((row) => row.productId)).toEqual([second.product.id]);
  });

  it("clears restrictions when empty arrays are sent", async () => {
    const catalog = await createTestProduct(tracker, { stock: 5, price: 100 });
    const coupon = await createCoupon(
      createCouponSchema.parse({
        code: `CLR${randomUUID().replace(/-/g, "").slice(0, 7)}`,
        name: "Clear joins",
        discountType: "FIXED_AMOUNT",
        discountValue: 8,
        ...couponWindow(),
        applicableProductIds: [catalog.product.id],
        applicableCategoryIds: [catalog.category.id],
      }),
    );
    tracker.couponIds.push(coupon.id);

    await updateCoupon(coupon.id, {
      applicableProductIds: [],
      applicableCategoryIds: [],
    });

    const products = await prisma.couponProduct.count({
      where: { couponId: coupon.id },
    });
    const categories = await prisma.couponCategory.count({
      where: { couponId: coupon.id },
    });
    expect(products).toBe(0);
    expect(categories).toBe(0);
  });

  it("excludes soft-deleted coupons from list and rejects deleted codes", async () => {
    const coupon = await createCoupon(
      createCouponSchema.parse({
        code: `DEL${randomUUID().replace(/-/g, "").slice(0, 7)}`,
        name: "To delete",
        discountType: "FIXED_AMOUNT",
        discountValue: 5,
        ...couponWindow(),
      }),
    );
    tracker.couponIds.push(coupon.id);
    await deleteCoupon(coupon.id);

    const listed = await listCoupons({ page: 1, limit: 50 });
    expect(listed.items.some((item) => item.id === coupon.id)).toBe(false);

    const user = await createTestUser(tracker, { suffix: `sd-${Date.now()}` });
    await expect(
      validateCouponCode(coupon.code, user.customerProfileId, {
        subtotal: 100,
        productIds: [],
        productCategoryIds: [],
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid coupon code",
    } satisfies Partial<AppError>);

    await expect(updateCoupon(coupon.id, { name: "Nope" })).rejects.toMatchObject(
      {
        statusCode: 404,
        message: "Coupon not found",
      } satisfies Partial<AppError>,
    );
  });
});
