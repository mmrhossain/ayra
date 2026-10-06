import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createTestProduct,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

describe("Inventory RESTOCK adjustment", () => {
  it("creates an adjustment with session createdBy and increases stock on approve", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `invadj-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker, { stock: 5 });

    const created = await api()
      .post("/api/v1/admin/inventory/adjustments")
      .set("Cookie", admin.cookie)
      .send({
        warehouseId: catalog.warehouse.id,
        variantId: catalog.variant.id,
        difference: 25,
        reason: "RESTOCK",
      });

    expect(created.status).toBe(201);
    expect(created.body.data.createdBy).toBe(admin.id);
    expect(created.body.data.approvedBy).toBeNull();
    expect(created.body.data.status).toBe("PENDING");
    expect(created.body.data.difference).toBe(25);

    const row = await prisma.inventoryAdjustment.findUniqueOrThrow({
      where: { id: created.body.data.id },
    });
    expect(row.createdBy).toBe(admin.id);

    const approved = await api()
      .post(`/api/v1/admin/inventory/adjustments/${created.body.data.id}/approve`)
      .set("Cookie", admin.cookie)
      .send({ approved: true });

    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe("APPROVED");
    expect(approved.body.data.approvedBy).toBe(admin.id);
    expect(approved.body.data.createdBy).toBe(admin.id);

    const inventory = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(inventory.quantityOnHand).toBe(30);
    expect(inventory.quantityAvailable).toBe(30);
  });

  it("rejects approval when on-hand quantity changed since the snapshot", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `invstale-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker, { stock: 5 });

    const created = await api()
      .post("/api/v1/admin/inventory/adjustments")
      .set("Cookie", admin.cookie)
      .send({
        warehouseId: catalog.warehouse.id,
        variantId: catalog.variant.id,
        difference: 25,
        reason: "RESTOCK",
      });
    expect(created.status).toBe(201);
    expect(created.body.data.previousQuantity).toBe(5);

    await prisma.inventory.update({
      where: { id: catalog.inventory.id },
      data: { quantityOnHand: 8, quantityAvailable: 8 },
    });

    const approved = await api()
      .post(`/api/v1/admin/inventory/adjustments/${created.body.data.id}/approve`)
      .set("Cookie", admin.cookie)
      .send({ approved: true });

    expect(approved.status).toBe(409);
    expect(approved.body.message).toBe(
      "Inventory quantity has changed since this adjustment was created"
    );

    const inventory = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(inventory.quantityOnHand).toBe(8);
    expect(inventory.quantityAvailable).toBe(8);

    const row = await prisma.inventoryAdjustment.findUniqueOrThrow({
      where: { id: created.body.data.id },
    });
    expect(row.status).toBe("PENDING");
  });

  it("rejects approval that would make inventory negative", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `invneg-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker, { stock: 5 });

    const created = await api()
      .post("/api/v1/admin/inventory/adjustments")
      .set("Cookie", admin.cookie)
      .send({
        warehouseId: catalog.warehouse.id,
        variantId: catalog.variant.id,
        difference: -10,
        reason: "DAMAGE",
      });
    expect(created.status).toBe(201);

    const approved = await api()
      .post(`/api/v1/admin/inventory/adjustments/${created.body.data.id}/approve`)
      .set("Cookie", admin.cookie)
      .send({ approved: true });

    expect(approved.status).toBe(400);
    expect(approved.body.message).toBe(
      "Adjustment would result in negative inventory"
    );

    const inventory = await prisma.inventory.findUniqueOrThrow({
      where: { id: catalog.inventory.id },
    });
    expect(inventory.quantityOnHand).toBe(5);
    expect(inventory.quantityAvailable).toBe(5);
  });

  it("lists inventory by product name and SKU search", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `invsearch-${Date.now()}`,
    });
    const match = await createTestProduct(tracker, {
      sku: `SEARCH-SKU-${Date.now()}`,
    });
    await createTestProduct(tracker, { sku: `OTHER-${Date.now()}` });

    const bySku = await api()
      .get("/api/v1/admin/inventory")
      .query({ search: match.variant.sku, limit: 20 })
      .set("Cookie", admin.cookie);
    expect(bySku.status).toBe(200);
    const skuIds = (bySku.body.data.items as Array<{ variantId: string }>).map(
      (row) => row.variantId
    );
    expect(skuIds).toContain(match.variant.id);

    const byName = await api()
      .get("/api/v1/admin/inventory")
      .query({ search: match.product.name, limit: 20 })
      .set("Cookie", admin.cookie);
    expect(byName.status).toBe(200);
    const nameIds = (byName.body.data.items as Array<{ variantId: string }>).map(
      (row) => row.variantId
    );
    expect(nameIds).toContain(match.variant.id);
  });

  it("returns the configured lowStockThreshold on inventory list", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `invth-${Date.now()}`,
    });

    const res = await api()
      .get("/api/v1/admin/inventory")
      .query({ limit: 1 })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(typeof res.body.data.lowStockThreshold).toBe("number");
    expect(res.body.data.lowStockThreshold).toBeGreaterThanOrEqual(0);
  });
});
