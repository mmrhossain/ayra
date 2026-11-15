import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { createShipment } from "../../src/modules/shipments/shipments.service.ts";
import {
  CleanupTracker,
  createTestOrder,
  createTestUser,
  getOrCreateWarehouse,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

describe("shipment creation", () => {
  it("serializes concurrent partial shipments for the same order", async () => {
    const user = await createTestUser(tracker, {
      suffix: `shipment-race-${Date.now()}`,
    });
    const order = await createTestOrder(tracker, user, {
      status: "CONFIRMED",
      grandTotal: 100,
    });
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productName: "Shipment test item",
        sku: `SHIP-${Date.now()}`,
        quantity: 1,
        unitPrice: 100,
        subtotal: 100,
      },
    });
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "COD",
        status: "PENDING",
        amount: 100,
      },
    });
    tracker.paymentIds.push(payment.id);
    const warehouse = await getOrCreateWarehouse(tracker);
    const input = {
      orderId: order.id,
      warehouseId: warehouse.id,
      courierProvider: "INTERNAL" as const,
      items: [{ orderItemId: orderItem.id, quantity: 1 }],
    };

    const results = await Promise.allSettled([
      createShipment(input, "test-admin"),
      createShipment(input, "test-admin"),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      status: "rejected",
      reason: { statusCode: 409 },
    });

    const shipments = await prisma.shipment.findMany({
      where: { orderId: order.id },
      include: { items: true },
    });
    expect(shipments).toHaveLength(1);
    expect(shipments[0]?.shipmentNumber).toMatch(/^SHP-[0-9]{6}-[0-9A-Z]{6}$/);
    expect(
      shipments.flatMap((shipment) => shipment.items).reduce((sum, item) => sum + item.quantity, 0),
    ).toBe(1);
  });
});
