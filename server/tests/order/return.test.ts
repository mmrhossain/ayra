import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createTestOrder,
  createTestProduct,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const attachOrderItem = async (
  orderId: string,
  catalog: Awaited<ReturnType<typeof createTestProduct>>
) => {
  return prisma.orderItem.create({
    data: {
      orderId,
      productName: catalog.product.name,
      sku: catalog.variant.sku,
      quantity: 2,
      unitPrice: 100,
      costPrice: 40,
      subtotal: 200,
      variantId: catalog.variant.id,
    },
  });
};

describe("Return request", () => {
  it("lets a customer create a return request for their delivered order", async () => {
    const user = await createTestUser(tracker, { suffix: `rr-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, user, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    const res = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", user.cookie)
      .send({
        reason: "Damaged item",
        items: [
          {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "REFUND",
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.items).toHaveLength(1);

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(updatedOrder.status).toBe("RETURN_REQUESTED");
  });

  it("rejects return requests for another user's order", async () => {
    const owner = await createTestUser(tracker, { suffix: `ro-${Date.now()}` });
    const other = await createTestUser(tracker, { suffix: `rx-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, owner, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    const res = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", other.cookie)
      .send({
        items: [
          {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "RESTOCK",
          },
        ],
      });

    expect(res.status).toBe(404);
  });

  it("rejects return requests for non-delivered orders", async () => {
    const user = await createTestUser(tracker, { suffix: `rp-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, user, { status: "PENDING" });
    const item = await attachOrderItem(order.id, catalog);

    const res = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", user.cookie)
      .send({
        items: [
          {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "REFUND",
          },
        ],
      });

    expect(res.status).toBe(400);
  });

  it("rejects a return that would exceed remaining quantity after prior approved returns", async () => {
    const user = await createTestUser(tracker, { suffix: `rcum-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, user, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        status: "APPROVED",
        items: {
          create: {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "REFUND",
          },
        },
      },
    });

    const res = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", user.cookie)
      .send({
        items: [
          {
            orderItemId: item.id,
            quantity: 2,
            restockOrRefund: "REFUND",
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/remaining returnable quantity/i);
  });

  it("allows a return for remaining quantity after a prior approved partial return", async () => {
    const user = await createTestUser(tracker, { suffix: `rrem-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, user, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        status: "APPROVED",
        items: {
          create: {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "REFUND",
          },
        },
      },
    });

    const res = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", user.cookie)
      .send({
        items: [
          {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "REFUND",
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].quantity).toBe(1);
  });

  it("does not count rejected returns against remaining quantity", async () => {
    const user = await createTestUser(tracker, { suffix: `rrej-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, user, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        status: "REJECTED",
        items: {
          create: {
            orderItemId: item.id,
            quantity: 2,
            restockOrRefund: "REFUND",
          },
        },
      },
    });

    const res = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", user.cookie)
      .send({
        items: [
          {
            orderItemId: item.id,
            quantity: 2,
            restockOrRefund: "REFUND",
          },
        ],
      });

    expect(res.status).toBe(201);
  });
});

describe("Admin return requests", () => {
  it("lets admin list and approve a return request", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `ra-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `rc-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, customer, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        reason: "Wrong size",
        items: [
          {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "RESTOCK",
          },
        ],
      });

    expect(created.status).toBe(201);
    const returnRequestId = created.body.data.id as string;

    const listed = await api()
      .get("/api/v1/admin/return-requests")
      .set("Cookie", admin.cookie);

    expect(listed.status).toBe(200);
    expect(listed.body.data.items.some((r: { id: string }) => r.id === returnRequestId)).toBe(
      true
    );

    const approved = await api()
      .patch(`/api/v1/admin/return-requests/${returnRequestId}`)
      .set("Cookie", admin.cookie)
      .send({ status: "APPROVED", adminNote: "Approved" });

    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe("APPROVED");

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(updatedOrder.status).toBe("DELIVERED");
    expect(updatedOrder.fulfillmentStatus).toBe("PARTIALLY_FULFILLED");
  });

  it("lets admin reject a return request", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `rj-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `rk-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, customer, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [
          {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "REFUND",
          },
        ],
      });

    expect(created.status).toBe(201);

    const rejected = await api()
      .patch(`/api/v1/admin/return-requests/${created.body.data.id}`)
      .set("Cookie", admin.cookie)
      .send({ status: "REJECTED", adminNote: "Out of window" });

    expect(rejected.status).toBe(200);
    expect(rejected.body.data.status).toBe("REJECTED");

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(updatedOrder.status).toBe("DELIVERED");
  });

  it("filters return requests by orderId", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `rf-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `rg-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, customer, { status: "DELIVERED" });
    const other = await createTestOrder(tracker, customer, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [
          {
            orderItemId: item.id,
            quantity: 1,
            restockOrRefund: "REFUND",
          },
        ],
      });

    expect(created.status).toBe(201);

    const listed = await api()
      .get("/api/v1/admin/return-requests")
      .query({ orderId: order.id })
      .set("Cookie", admin.cookie);

    expect(listed.status).toBe(200);
    expect(listed.body.data.items).toHaveLength(1);
    expect(listed.body.data.items[0].orderId).toBe(order.id);

    const empty = await api()
      .get("/api/v1/admin/return-requests")
      .query({ orderId: other.id })
      .set("Cookie", admin.cookie);

    expect(empty.status).toBe(200);
    expect(empty.body.data.items).toHaveLength(0);
  });
});

describe("Return approval fulfillment", () => {
  it("restocks inventory with a RETURN_IN transaction when a RESTOCK item is approved", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `sa-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, { suffix: `sb-${Date.now()}` });
    const catalog = await createTestProduct(tracker, { stock: 5 });
    const order = await createTestOrder(tracker, customer, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [{ orderItemId: item.id, quantity: 2, restockOrRefund: "RESTOCK" }],
      });

    expect(created.status).toBe(201);
    const returnRequestId = created.body.data.id as string;

    const before = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });

    const approved = await api()
      .patch(`/api/v1/admin/return-requests/${returnRequestId}`)
      .set("Cookie", admin.cookie)
      .send({ status: "APPROVED", adminNote: "Restock please" });

    expect(approved.status).toBe(200);

    const after = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(after.quantityOnHand).toBe(before.quantityOnHand + 2);
    expect(after.quantityAvailable).toBe(before.quantityAvailable + 2);

    const returned = await prisma.inventoryTransaction.findFirst({
      where: { inventoryId: catalog.inventory.id, type: "RETURN_IN" },
    });
    expect(returned).not.toBeNull();
    expect(returned?.quantity).toBe(2);
    expect(returned?.referenceId).toBe(returnRequestId);

    const returnItem = await prisma.returnItem.findFirstOrThrow({
      where: { returnRequestId },
    });
    expect(returnItem.restockToStock).toBe(true);
    expect(returnItem.damaged).toBe(false);
    expect(returnItem.allocationVersion).toBe(1);
    expect(Number(returnItem.salesAdjustmentAmount)).toBe(200);
    expect(Number(returnItem.costAdjustmentAmount)).toBe(80);

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(updatedOrder.status).toBe("RETURNED");
    expect(updatedOrder.fulfillmentStatus).toBe("FULFILLED");
  });

  it("queues a manual refund when a REFUND item is approved", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `fa-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, { suffix: `fb-${Date.now()}` });
    const catalog = await createTestProduct(tracker, { stock: 5 });
    const order = await createTestOrder(tracker, customer, { status: "DELIVERED" });
    const item = await attachOrderItem(order.id, catalog);

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: 200,
        provider: "SSLCOMMERZ",
        providerReference: `TRAN-RF-${Date.now()}`,
      },
    });
    tracker.paymentIds.push(payment.id);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [{ orderItemId: item.id, quantity: 1, restockOrRefund: "REFUND" }],
      });

    expect(created.status).toBe(201);
    const returnRequestId = created.body.data.id as string;

    const approved = await api()
      .patch(`/api/v1/admin/return-requests/${returnRequestId}`)
      .set("Cookie", admin.cookie)
      .send({ status: "APPROVED", adminNote: "Refund please" });

    expect(approved.status).toBe(200);

    const refund = await prisma.refund.findFirst({ where: { paymentId: payment.id } });
    expect(refund).not.toBeNull();
    expect(Number(refund?.amount)).toBe(100);
    expect(refund?.status).toBe("PENDING");
    expect(refund?.requiresManualProcessing).toBe(true);

    const event = await prisma.paymentEvent.findFirst({
      where: { paymentId: payment.id, eventType: "REFUND_CREATED" },
    });
    expect(event).not.toBeNull();
  });

  it("prorates the order discount and tax into the refund amount", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `da-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, { suffix: `db-${Date.now()}` });
    const catalog = await createTestProduct(tracker, { stock: 5 });
    const order = await createTestOrder(tracker, customer, {
      status: "DELIVERED",
      subtotal: 200,
      discountAmount: 50,
      taxAmount: 15,
      grandTotal: 165,
    });
    const item = await attachOrderItem(order.id, catalog);

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: 165,
        provider: "SSLCOMMERZ",
        providerReference: `TRAN-DISC-${Date.now()}`,
      },
    });
    tracker.paymentIds.push(payment.id);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [{ orderItemId: item.id, quantity: 1, restockOrRefund: "REFUND" }],
      });

    expect(created.status).toBe(201);

    const approved = await api()
      .patch(`/api/v1/admin/return-requests/${created.body.data.id}`)
      .set("Cookie", admin.cookie)
      .send({ status: "APPROVED" });

    expect(approved.status).toBe(200);

    const refund = await prisma.refund.findFirstOrThrow({
      where: { paymentId: payment.id },
    });
    // 100 gross - 25 discount share + 7.50 tax share
    expect(Number(refund.amount)).toBe(82.5);
  });

  it("refunds shipping only when the whole order is returned", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `fa-ship-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, { suffix: `fb-ship-${Date.now()}` });
    const catalog = await createTestProduct(tracker, { stock: 5 });

    const fullOrder = await createTestOrder(tracker, customer, {
      status: "DELIVERED",
      subtotal: 200,
      shippingAmount: 60,
      grandTotal: 260,
    });
    const fullItem = await attachOrderItem(fullOrder.id, catalog);
    const fullPayment = await prisma.payment.create({
      data: {
        orderId: fullOrder.id,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: 260,
        provider: "SSLCOMMERZ",
        providerReference: `TRAN-FULL-${Date.now()}`,
      },
    });
    tracker.paymentIds.push(fullPayment.id);

    const fullCreated = await api()
      .post(`/api/v1/orders/${fullOrder.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [{ orderItemId: fullItem.id, quantity: 2, restockOrRefund: "REFUND" }],
      });

    expect(fullCreated.status).toBe(201);

    await api()
      .patch(`/api/v1/admin/return-requests/${fullCreated.body.data.id}`)
      .set("Cookie", admin.cookie)
      .send({ status: "APPROVED" });

    const fullRefund = await prisma.refund.findFirstOrThrow({
      where: { paymentId: fullPayment.id },
    });
    expect(Number(fullRefund.amount)).toBe(260);

    const partialOrder = await createTestOrder(tracker, customer, {
      status: "DELIVERED",
      subtotal: 200,
      shippingAmount: 60,
      grandTotal: 260,
    });
    const partialItem = await attachOrderItem(partialOrder.id, catalog);
    const partialPayment = await prisma.payment.create({
      data: {
        orderId: partialOrder.id,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: 260,
        provider: "SSLCOMMERZ",
        providerReference: `TRAN-PART-${Date.now()}`,
      },
    });
    tracker.paymentIds.push(partialPayment.id);

    const partialCreated = await api()
      .post(`/api/v1/orders/${partialOrder.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [{ orderItemId: partialItem.id, quantity: 1, restockOrRefund: "REFUND" }],
      });

    expect(partialCreated.status).toBe(201);

    await api()
      .patch(`/api/v1/admin/return-requests/${partialCreated.body.data.id}`)
      .set("Cookie", admin.cookie)
      .send({ status: "APPROVED" });

    const partialRefund = await prisma.refund.findFirstOrThrow({
      where: { paymentId: partialPayment.id },
    });
    expect(Number(partialRefund.amount)).toBe(100);
  });

  it("does not restock or reverse cost when the admin marks an item damaged", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `dmg-a-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `dmg-c-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker, { stock: 5 });
    const order = await createTestOrder(tracker, customer, {
      status: "DELIVERED",
      subtotal: 200,
      grandTotal: 200,
    });
    const item = await attachOrderItem(order.id, catalog);
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: 200,
        provider: "SSLCOMMERZ",
        providerReference: `TRAN-DMG-${Date.now()}`,
      },
    });
    tracker.paymentIds.push(payment.id);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [{ orderItemId: item.id, quantity: 2, restockOrRefund: "RESTOCK" }],
      });
    expect(created.status).toBe(201);
    const returnRequestId = created.body.data.id as string;

    const before = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });

    const approved = await api()
      .patch(`/api/v1/admin/return-requests/${returnRequestId}`)
      .set("Cookie", admin.cookie)
      .send({
        status: "APPROVED",
        items: [{ orderItemId: item.id, restockToStock: false, damaged: true }],
      });
    expect(approved.status).toBe(200);

    const after = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(after.quantityOnHand).toBe(before.quantityOnHand);
    expect(after.quantityAvailable).toBe(before.quantityAvailable);

    const returnItem = await prisma.returnItem.findFirstOrThrow({
      where: { returnRequestId },
    });
    expect(returnItem.restockToStock).toBe(false);
    expect(returnItem.damaged).toBe(true);
    expect(Number(returnItem.salesAdjustmentAmount)).toBe(200);
    expect(Number(returnItem.costAdjustmentAmount)).toBe(0);

    const refund = await prisma.refund.findFirstOrThrow({
      where: { returnRequestId },
    });
    expect(Number(refund.amount)).toBe(200);
  });

  it("caps the refund at the amount actually captured", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `cap-a-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `cap-c-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker, { stock: 5 });
    const order = await createTestOrder(tracker, customer, {
      status: "DELIVERED",
      subtotal: 100,
      grandTotal: 100,
    });
    const item = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productName: catalog.product.name,
        sku: catalog.variant.sku,
        quantity: 1,
        unitPrice: 100,
        costPrice: 40,
        subtotal: 100,
        variantId: catalog.variant.id,
      },
    });
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: 40,
        provider: "SSLCOMMERZ",
        providerReference: `TRAN-CAP-${Date.now()}`,
      },
    });
    tracker.paymentIds.push(payment.id);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [{ orderItemId: item.id, quantity: 1, restockOrRefund: "REFUND" }],
      });
    expect(created.status).toBe(201);
    const returnRequestId = created.body.data.id as string;

    const approved = await api()
      .patch(`/api/v1/admin/return-requests/${returnRequestId}`)
      .set("Cookie", admin.cookie)
      .send({ status: "APPROVED" });
    expect(approved.status).toBe(200);

    const refund = await prisma.refund.findFirstOrThrow({
      where: { returnRequestId },
    });
    expect(Number(refund.amount)).toBe(40);

    const event = await prisma.paymentEvent.findFirstOrThrow({
      where: { paymentId: payment.id, eventType: "REFUND_CREATED" },
    });
    expect(event.metadata).toMatchObject({
      amount: 40,
      requestedRefundAmount: 100,
      refundCapped: true,
    });
  });

  it("applies a concurrent approval exactly once", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `conc-a-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `conc-c-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker, { stock: 5 });
    const order = await createTestOrder(tracker, customer, {
      status: "DELIVERED",
      subtotal: 100,
      grandTotal: 100,
    });
    const item = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productName: catalog.product.name,
        sku: catalog.variant.sku,
        quantity: 1,
        unitPrice: 100,
        costPrice: 40,
        subtotal: 100,
        variantId: catalog.variant.id,
      },
    });
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "SSLCOMMERZ",
        status: "SUCCESS",
        amount: 100,
        provider: "SSLCOMMERZ",
        providerReference: `TRAN-CONC-${Date.now()}`,
      },
    });
    tracker.paymentIds.push(payment.id);

    const created = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", customer.cookie)
      .send({
        items: [{ orderItemId: item.id, quantity: 1, restockOrRefund: "RESTOCK" }],
      });
    expect(created.status).toBe(201);
    const returnRequestId = created.body.data.id as string;

    const responses = await Promise.all([
      api()
        .patch(`/api/v1/admin/return-requests/${returnRequestId}`)
        .set("Cookie", admin.cookie)
        .send({ status: "APPROVED" }),
      api()
        .patch(`/api/v1/admin/return-requests/${returnRequestId}`)
        .set("Cookie", admin.cookie)
        .send({ status: "APPROVED" }),
    ]);

    expect(responses.filter((res) => res.status === 200)).toHaveLength(1);
    expect(responses.filter((res) => res.status === 400)).toHaveLength(1);

    expect(
      await prisma.refund.count({ where: { returnRequestId } }),
    ).toBe(1);
    expect(
      await prisma.inventoryTransaction.count({
        where: { referenceId: returnRequestId, type: "RETURN_IN" },
      }),
    ).toBe(1);
  });

  it("rejects returns requested after the 14 day window", async () => {
    const user = await createTestUser(tracker, { suffix: `rw-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const deliveredAt = new Date();
    deliveredAt.setDate(deliveredAt.getDate() - 15);
    const order = await createTestOrder(tracker, user, {
      status: "DELIVERED",
      deliveredAt,
    });
    const item = await attachOrderItem(order.id, catalog);

    const res = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", user.cookie)
      .send({
        items: [{ orderItemId: item.id, quantity: 1, restockOrRefund: "REFUND" }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/return window has expired/i);
  });

  it("rejects returns for orders without a delivery timestamp", async () => {
    const user = await createTestUser(tracker, { suffix: `rd-${Date.now()}` });
    const catalog = await createTestProduct(tracker);
    const order = await createTestOrder(tracker, user, {
      status: "DELIVERED",
      deliveredAt: null,
    });
    const item = await attachOrderItem(order.id, catalog);

    const res = await api()
      .post(`/api/v1/orders/${order.id}/return-request`)
      .set("Cookie", user.cookie)
      .send({
        items: [{ orderItemId: item.id, quantity: 1, restockOrRefund: "REFUND" }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/delivery timestamp/i);
  });
});
