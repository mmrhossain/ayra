import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { checkout } from "../../src/modules/order/services/order.service.ts";
import {
  CleanupTracker,
  api,
  createActiveCartWithItem,
  createTestOrder,
  createTestProduct,
  createTestUser,
  testAddress,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

describe("Order checkout concurrency", () => {
  it("does not oversell a limited-stock variant", async () => {
    const catalog = await createTestProduct(tracker, { stock: 1, price: 100 });

    const users = await Promise.all([
      createTestUser(tracker, { suffix: `o1-${Date.now()}` }),
      createTestUser(tracker, { suffix: `o2-${Date.now()}` }),
    ]);

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
      users.map((u) =>
        checkout(u.customerProfileId, {
          paymentMethod: "COD",
          billingAddress: testAddress,
          shippingMethodCode: "STANDARD",
        })
      )
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    for (const r of fulfilled) {
      if (r.status === "fulfilled") tracker.orderIds.push(r.value.id);
    }

    const inventory = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(inventory.quantityAvailable).toBe(0);
    expect(inventory.quantityReserved).toBe(1);
  });

  it("allows a second checkout after the first cart is CHECKED_OUT", async () => {
    const catalog = await createTestProduct(tracker, { stock: 4, price: 100 });
    const user = await createTestUser(tracker, { suffix: `c2-${Date.now()}` });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const first = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: testAddress,
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(first.id);

    const firstCart = await prisma.cart.findFirst({
      where: { customerProfileId: user.customerProfileId, status: "CHECKED_OUT" },
    });
    expect(firstCart).toBeTruthy();

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const second = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: testAddress,
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(second.id);

    expect(second.id).not.toBe(first.id);

    const checkedOut = await prisma.cart.count({
      where: { customerProfileId: user.customerProfileId, status: "CHECKED_OUT" },
    });
    expect(checkedOut).toBe(2);
  });

  it("rejects checkout of a draft product already in the cart", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `draft-${Date.now()}` });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    await prisma.product.update({
      where: { id: catalog.product.id },
      data: { status: "DRAFT" },
    });

    await expect(
      checkout(user.customerProfileId, {
        paymentMethod: "COD",
        billingAddress: testAddress,
        shippingMethodCode: "STANDARD",
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("OrderAddress uniqueness", () => {
  it("creates both SHIPPING and BILLING addresses on checkout", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `oa-${Date.now()}` });

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
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    const addresses = await prisma.orderAddress.findMany({
      where: { orderId: order.id },
    });

    expect(addresses).toHaveLength(2);
    expect(addresses.map((a) => a.type).sort()).toEqual(["BILLING", "SHIPPING"]);
    expect(addresses.every((a) => a.division === testAddress.division)).toBe(true);
    expect(addresses.every((a) => a.district === testAddress.district)).toBe(true);
    expect(addresses.every((a) => a.phone === testAddress.phone)).toBe(true);
  });

  it("saves a new checkout address to the customer address book", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const user = await createTestUser(tracker, { suffix: `as-${Date.now()}` });

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
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    const saved = await prisma.address.findMany({
      where: { customerProfileId: user.customerProfileId },
    });

    expect(saved).toHaveLength(1);
    expect(saved[0]?.addressLine1).toBe(testAddress.addressLine1);
    expect(saved[0]?.district).toBe(testAddress.district);
    expect(saved[0]?.phone).toBe(testAddress.phone);
  });

  it("does not duplicate a checkout address already in the address book", async () => {
    const catalog = await createTestProduct(tracker, { stock: 4, price: 100 });
    const user = await createTestUser(tracker, { suffix: `adup-${Date.now()}` });

    await prisma.address.create({
      data: {
        customerProfileId: user.customerProfileId,
        fullName: "TEST BUYER",
        phone: testAddress.phone,
        country: testAddress.country,
        division: testAddress.division,
        district: "DHAKA",
        thana: testAddress.thana,
        addressLine1: "  12 Test Avenue  ",
      },
    });

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const first = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: testAddress,
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(first.id);

    await createActiveCartWithItem(
      tracker,
      user.customerProfileId,
      catalog.variant,
      catalog.product.name,
      1
    );

    const second = await checkout(user.customerProfileId, {
      paymentMethod: "COD",
      billingAddress: {
        ...testAddress,
        addressLine1: "12 TEST AVENUE",
        district: "dhaka",
      },
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(second.id);

    const saved = await prisma.address.findMany({
      where: { customerProfileId: user.customerProfileId },
    });
    expect(saved).toHaveLength(1);
  });

  it("rejects a duplicate OrderAddress type for the same order", async () => {
    const owner = await createTestUser(tracker, { suffix: `od-${Date.now()}` });
    const order = await createTestOrder(tracker, owner);

    await expect(
      prisma.orderAddress.create({
        data: {
          orderId: order.id,
          type: "BILLING",
          fullName: testAddress.fullName,
          phone: testAddress.phone,
          country: testAddress.country,
          division: testAddress.division,
          district: testAddress.district,
          addressLine1: testAddress.addressLine1,
        },
      })
    ).rejects.toThrow();
  });
});

describe("OrderItem costPrice snapshot", () => {
  it("snapshots variant costPrice onto OrderItem at checkout", async () => {
    const catalog = await createTestProduct(tracker, {
      stock: 2,
      price: 150,
      costPrice: 80,
    });
    const user = await createTestUser(tracker, { suffix: `cp-${Date.now()}` });

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
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    expect(items).toHaveLength(1);
    expect(Number(items[0]!.unitPrice)).toBe(150);
    expect(Number(items[0]!.costPrice)).toBe(80);

    await prisma.productVariant.update({
      where: { id: catalog.variant.id },
      data: { costPrice: 10, price: 999 },
    });

    const frozen = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });
    expect(Number(frozen[0]!.costPrice)).toBe(80);
    expect(Number(frozen[0]!.unitPrice)).toBe(150);

    const listed = await api()
      .get(`/api/v1/orders/${order.id}`)
      .set("Cookie", user.cookie);

    expect(listed.status).toBe(200);
    expect(listed.body.data.items[0].costPrice).toBeUndefined();
  });
});

describe("OrderItem variantName snapshot", () => {
  it("stores attribute combination as variantName and keeps sku separate", async () => {
    const catalog = await createTestProduct(tracker, { stock: 2, price: 100 });
    const tag = randomUUID().slice(0, 8);
    const color = await prisma.attribute.create({ data: { name: `Color-${tag}` } });
    const size = await prisma.attribute.create({ data: { name: `Size-${tag}` } });
    const red = await prisma.attributeValue.create({
      data: { attributeId: color.id, value: "Red" },
    });
    const medium = await prisma.attributeValue.create({
      data: { attributeId: size.id, value: "Medium" },
    });
    await prisma.variantAttribute.createMany({
      data: [
        { variantId: catalog.variant.id, attributeValueId: red.id },
        { variantId: catalog.variant.id, attributeValueId: medium.id },
      ],
    });

    const user = await createTestUser(tracker, { suffix: `vn-${Date.now()}` });
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
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    const item = await prisma.orderItem.findFirstOrThrow({
      where: { orderId: order.id },
    });
    expect(item.sku).toBe(catalog.variant.sku);
    expect(item.variantName).toBe("Red / Medium");
  });

  it("uses a collision-safe ORD- prefix on generated order numbers", async () => {
    const catalog = await createTestProduct(tracker, { stock: 1, price: 100 });
    const user = await createTestUser(tracker, { suffix: `on-${Date.now()}` });
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
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    expect(order.orderNumber).toMatch(/^ORD-[0-9A-F]{12}$/);
  });
});

describe("Order confirmation notification", () => {
  it("creates a PENDING ORDER_CONFIRMATION notification after checkout", async () => {
    const catalog = await createTestProduct(tracker, { stock: 1, price: 100 });
    const user = await createTestUser(tracker, { suffix: `ocn-${Date.now()}` });
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
      shippingMethodCode: "STANDARD",
    });
    tracker.orderIds.push(order.id);

    const notification = await prisma.notification.findFirst({
      where: { userId: user.id },
      include: { template: true },
    });

    expect(notification).not.toBeNull();
    expect(notification?.status).toBe("PENDING");
    expect(notification?.channel).toBe("EMAIL");
    expect(notification?.recipient).toBe(user.email);
    expect(notification?.template?.code).toBe("ORDER_CONFIRMATION");
    expect(notification?.subject).toContain(order.orderNumber);
    expect(notification?.content).toContain(order.orderNumber);
  });
});

describe("Order ownership", () => {
  it("returns 404 when fetching another user's order", async () => {
    const owner = await createTestUser(tracker, { suffix: `ow-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `ot-${Date.now()}` });
    const order = await createTestOrder(tracker, owner);

    const res = await api()
      .get(`/api/v1/orders/${order.id}`)
      .set("Cookie", other.cookie);

    expect(res.status).toBe(404);
  });
});

describe("Order status transitions", () => {
  it("rejects invalid status transition", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `st-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `sc-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, customer, { status: "PENDING" });

    const res = await api()
      .patch(`/api/v1/admin/orders/${order.id}/status`)
      .set("Cookie", admin.cookie)
      .send({ status: "DELIVERED" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(String(res.body.message)).toMatch(/Invalid status transition/i);
  });

  it("rejects CONFIRMED on unpaid non-COD orders", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `unpaid-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `unpaid-c-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, customer, { status: "PENDING" });
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "SSLCOMMERZ",
        status: "PENDING",
        amount: order.grandTotal,
      },
    });
    tracker.paymentIds.push(payment.id);

    const res = await api()
      .patch(`/api/v1/admin/orders/${order.id}/status`)
      .set("Cookie", admin.cookie)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Cannot confirm unpaid order until payment is complete"
    );

    const unchanged = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(unchanged.status).toBe("PENDING");
  });

  it("allows CONFIRMED for unpaid COD orders", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `codconf-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `codconf-c-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, customer, { status: "PENDING" });
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "COD",
        status: "PENDING",
        amount: order.grandTotal,
      },
    });
    tracker.paymentIds.push(payment.id);

    const res = await api()
      .patch(`/api/v1/admin/orders/${order.id}/status`)
      .set("Cookie", admin.cookie)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CONFIRMED");
  });

  it("allows CONFIRMED when paymentStatus is already PAID", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `paidconf-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `paidconf-c-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, customer, { status: "PENDING" });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID" },
    });
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: order.grandTotal,
      },
    });
    tracker.paymentIds.push(payment.id);

    const res = await api()
      .patch(`/api/v1/admin/orders/${order.id}/status`)
      .set("Cookie", admin.cookie)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CONFIRMED");
  });
});

describe("Customer order status history", () => {
  it("omits changedBy from customer statusHistory", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `hist-c-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, customer, { status: "CONFIRMED" });
    await prisma.orderStatusHistory.createMany({
      data: [
        {
          orderId: order.id,
          status: "PENDING",
          remarks: "Order created",
          changedBy: customer.customerProfileId,
        },
        {
          orderId: order.id,
          status: "CONFIRMED",
          remarks: "Payment verified",
          changedBy: "admin-user-id",
        },
      ],
    });

    const res = await api()
      .get(`/api/v1/orders/${order.id}`)
      .set("Cookie", customer.cookie);

    expect(res.status).toBe(200);
    const history = res.body.data.statusHistory;
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      status: "PENDING",
      remarks: "Order created",
    });
    expect(history[1]).toMatchObject({
      status: "CONFIRMED",
      remarks: "Payment verified",
    });
    for (const entry of history) {
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("createdAt");
      expect(entry).not.toHaveProperty("changedBy");
      expect(entry).not.toHaveProperty("updatedAt");
      expect(entry).not.toHaveProperty("orderId");
    }
  });

  it("synthesizes a current-status history row when none exist", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `legacy-c-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, customer, {
      status: "PROCESSING",
    });

    const before = await prisma.orderStatusHistory.count({
      where: { orderId: order.id },
    });
    expect(before).toBe(0);

    const res = await api()
      .get(`/api/v1/orders/${order.id}`)
      .set("Cookie", customer.cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.statusHistory).toEqual([
      expect.objectContaining({
        id: `legacy-${order.id}`,
        status: "PROCESSING",
        remarks: null,
      }),
    ]);
    expect(res.body.data.statusHistory[0]).not.toHaveProperty("changedBy");

    const after = await prisma.orderStatusHistory.count({
      where: { orderId: order.id },
    });
    expect(after).toBe(0);
  });
});
