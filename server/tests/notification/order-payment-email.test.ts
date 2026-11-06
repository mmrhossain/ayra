import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { checkout } from "../../src/modules/order/services/order.service.ts";
import {
  CleanupTracker,
  createActiveCartWithItem,
  createTestProduct,
  createTestUser,
  testAddress,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

describe("Order confirmation email queue", () => {
  it("enqueues ORDER_CONFIRMATION after checkout commits", async () => {
    const catalog = await createTestProduct(tracker, { stock: 1, price: 120 });
    const user = await createTestUser(tracker, { suffix: `norder-${Date.now()}` });
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

    const rows = await prisma.notification.findMany({
      where: { userId: user.id, channel: "EMAIL" },
      include: { template: true },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("PENDING");
    expect(rows[0]?.template?.code).toBe("ORDER_CONFIRMATION");
    expect(rows[0]?.content).toContain(catalog.product.name);
    expect(rows[0]?.content).toContain(Number(order.grandTotal).toFixed(2));
    expect(rows[0]?.content).toContain('<table role="presentation"');
    expect(rows[0]?.content).toContain("Qty");
    expect(rows[0]?.content).toContain("Total");
    expect(rows[0]?.content).not.toContain("1x ");
    expect(rows[0]?.content).toContain("Ayra Team");
    expect(rows[0]?.content).not.toContain("Rangalay");
  });

  it("escapes product names in the rendered email", async () => {
    const catalog = await createTestProduct(tracker, {
      stock: 1,
      price: 120,
      name: "Ayra <script>alert(1)</script>",
    });
    const user = await createTestUser(tracker, { suffix: `nescape-${Date.now()}` });
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

    const notification = await prisma.notification.findFirstOrThrow({
      where: { userId: user.id, channel: "EMAIL" },
    });

    expect(notification.content).toContain("&lt;script&gt;");
    expect(notification.content).not.toContain("<script>");
  });
});
