import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { checkout } from "../../src/modules/order/services/order.service.ts";
import { AppError } from "../../src/common/errors/AppError.ts";
import {
  CleanupTracker,
  createActiveCartWithItem,
  createTestProduct,
  createTestUser,
  ensureDefaultShippingCatalog,
  testAddress,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
  await ensureDefaultShippingCatalog();
});

const gazipurAddress = { ...testAddress, district: "Gazipur" };

describe("Checkout shipping amount", () => {
  it("charges 60 for Inside Dhaka standard and includes it in grandTotal", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `shd-${Date.now()}` });
    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const order = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: testAddress,
      shippingAddress: testAddress,
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    expect(Number(order.shippingAmount)).toBe(60);
    expect(order.shippingMethodCode).toBe("STANDARD");
    expect(order.shippingMethodName).toBe("Standard Delivery");
    expect(Number(order.taxAmount)).toBe(0);
    expect(Number(order.grandTotal)).toBe(160);

    const persisted = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(Number(persisted.shippingAmount)).toBe(60);
    expect(persisted.shippingMethodCode).toBe("STANDARD");
    expect(Number(persisted.grandTotal)).toBe(160);
  });

  it("charges 120 for Outside Dhaka standard and includes it in grandTotal", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `shg-${Date.now()}` });
    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const order = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: gazipurAddress,
      shippingAddress: gazipurAddress,
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    expect(Number(order.shippingAmount)).toBe(120);
    expect(Number(order.grandTotal)).toBe(220);
  });

  it("charges 120 for Inside Dhaka express", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `she-${Date.now()}` });
    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const order = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: testAddress,
      shippingAddress: testAddress,
      shippingMethodCode: "EXPRESS",
    });
    tracker.orderIds.push(order.id);

    expect(Number(order.shippingAmount)).toBe(120);
    expect(order.shippingMethodCode).toBe("EXPRESS");
    expect(Number(order.grandTotal)).toBe(220);
  });

  it("makes shipping free when subtotal meets freeShippingFrom", async () => {
    const catalog = await ensureDefaultShippingCatalog();
    const insideStandard = await prisma.shippingRate.findUniqueOrThrow({
      where: {
        shippingZoneId_shippingMethodId: {
          shippingZoneId: catalog.insideDhaka.id,
          shippingMethodId: catalog.standard.id,
        },
      },
    });
    await prisma.shippingRate.update({
      where: { id: insideStandard.id },
      data: { freeShippingFrom: 150 },
    });

    const product = await createTestProduct(tracker, { stock: 2, price: 200 });
    const user = await createTestUser(tracker, { suffix: `shf-${Date.now()}` });
    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      product.variant,
      product.product.name,
      1
    );

    const order = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: testAddress,
      shippingAddress: testAddress,
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    expect(Number(order.shippingAmount)).toBe(0);
    expect(Number(order.grandTotal)).toBe(200);
  });

  it("rejects an invalid shipping method", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `shi-${Date.now()}` });
    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    await expect(
      checkout(user.customerProfileId, {
        paymentMethod: "COD",
        billingAddress: testAddress,
        shippingAddress: testAddress,
        shippingMethodCode: "DOES_NOT_EXIST",
      })
    ).rejects.toMatchObject({ message: "Invalid shipping method", statusCode: 400 } satisfies Partial<AppError>);
  });

  it("rejects an inactive shipping method", async () => {
    const catalog = await ensureDefaultShippingCatalog();
    await prisma.shippingMethod.update({
      where: { id: catalog.express.id },
      data: { isActive: false },
    });

    const product = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `shn-${Date.now()}` });
    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      product.variant,
      product.product.name,
      1
    );

    await expect(
      checkout(user.customerProfileId, {
        paymentMethod: "COD",
        billingAddress: testAddress,
        shippingAddress: testAddress,
        shippingMethodCode: "EXPRESS",
      })
    ).rejects.toMatchObject({ message: "Invalid shipping method", statusCode: 400 } satisfies Partial<AppError>);
  });

  it("rejects checkout when the matching rate is missing", async () => {
    const catalog = await ensureDefaultShippingCatalog();
    await prisma.shippingRate.delete({
      where: {
        shippingZoneId_shippingMethodId: {
          shippingZoneId: catalog.insideDhaka.id,
          shippingMethodId: catalog.express.id,
        },
      },
    });

    const product = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `shm-${Date.now()}` });
    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      product.variant,
      product.product.name,
      1
    );

    await expect(
      checkout(user.customerProfileId, {
        paymentMethod: "COD",
        billingAddress: testAddress,
        shippingAddress: testAddress,
        shippingMethodCode: "EXPRESS",
      })
    ).rejects.toMatchObject({
      message: "No shipping rate is available for this method and address",
      statusCode: 400,
    } satisfies Partial<AppError>);
  });

  it("ignores a frontend shipping amount and stores the backend total", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `sht-${Date.now()}` });
    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const order = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: testAddress,
      shippingAddress: testAddress,
      shippingMethodCode: "STANDARD",
      ...( { shippingAmount: 1, grandTotal: 1 } as Record<string, unknown> ),
    } as Parameters<typeof checkout>[1]);
    tracker.orderIds.push(order.id);

    expect(Number(order.shippingAmount)).toBe(60);
    expect(Number(order.grandTotal)).toBe(160);
    expect(Number(order.payments[0]?.amount)).toBe(160);
  });
});
