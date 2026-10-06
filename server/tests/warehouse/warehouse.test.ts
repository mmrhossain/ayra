import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const warehousePayload = (tag: string) => ({
  name: `Warehouse ${tag}`,
  code: `WH-${tag}`,
  country: "Bangladesh",
  city: "Dhaka",
  addressLine1: "1 Test Road",
  phone: "01700000000",
  email: `wh-${tag}@example.test`,
  state: "Dhaka",
  addressLine2: "Level 2",
});

describe("Warehouse admin CRUD", () => {
  it("forbids warehouse list/create without admin role", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `whc-${Date.now()}`,
    });

    const unauth = await api().get("/api/v1/admin/warehouses");
    expect([401, 403]).toContain(unauth.status);

    const customerList = await api()
      .get("/api/v1/admin/warehouses")
      .set("Cookie", customer.cookie);
    expect(customerList.status).toBe(403);

    const customerCreate = await api()
      .post("/api/v1/admin/warehouses")
      .set("Cookie", customer.cookie)
      .send(warehousePayload(randomUUID().slice(0, 8)));
    expect(customerCreate.status).toBe(403);
  });

  it("creates, lists, fetches, updates, and soft-deletes a warehouse", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `wha-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    const payload = warehousePayload(tag);

    const created = await api()
      .post("/api/v1/admin/warehouses")
      .set("Cookie", admin.cookie)
      .send(payload);

    expect(created.status).toBe(201);
    expect(created.body.data.code).toBe(payload.code);
    expect(created.body.data.name).toBe(payload.name);
    tracker.warehouseIds.push(created.body.data.id);

    const list = await api()
      .get("/api/v1/admin/warehouses")
      .set("Cookie", admin.cookie);
    expect(list.status).toBe(200);
    const ids = (list.body.data.items as Array<{ id: string }>).map((w) => w.id);
    expect(ids).toContain(created.body.data.id);
    expect(list.body.data.pagination).toMatchObject({
      page: 1,
      limit: 20,
    });

    const fetched = await api()
      .get(`/api/v1/admin/warehouses/${created.body.data.id}`)
      .set("Cookie", admin.cookie);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(created.body.data.id);

    const updated = await api()
      .put(`/api/v1/admin/warehouses/${created.body.data.id}`)
      .set("Cookie", admin.cookie)
      .send({ name: "Updated Warehouse" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe("Updated Warehouse");

    const deleted = await api()
      .delete(`/api/v1/admin/warehouses/${created.body.data.id}`)
      .set("Cookie", admin.cookie);
    expect(deleted.status).toBe(200);

    const row = await prisma.warehouse.findUniqueOrThrow({
      where: { id: created.body.data.id },
    });
    expect(row.deletedAt).not.toBeNull();
    expect(row.isActive).toBe(false);

    const afterDelete = await api()
      .get(`/api/v1/admin/warehouses/${created.body.data.id}`)
      .set("Cookie", admin.cookie);
    expect(afterDelete.status).toBe(404);
  });

  it("rejects duplicate warehouse codes", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `whd-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    const payload = warehousePayload(tag);

    const first = await api()
      .post("/api/v1/admin/warehouses")
      .set("Cookie", admin.cookie)
      .send(payload);
    expect(first.status).toBe(201);
    tracker.warehouseIds.push(first.body.data.id);

    const second = await api()
      .post("/api/v1/admin/warehouses")
      .set("Cookie", admin.cookie)
      .send({ ...payload, name: "Other" });
    expect(second.status).toBe(409);
  });

  it("filters warehouses by name/code search with pagination", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `whs-${Date.now()}`,
    });
    const stamp = randomUUID().slice(0, 8);

    const named = await api()
      .post("/api/v1/admin/warehouses")
      .set("Cookie", admin.cookie)
      .send(warehousePayload(`NM${stamp}`));
    expect(named.status).toBe(201);
    tracker.warehouseIds.push(named.body.data.id);

    const coded = await api()
      .post("/api/v1/admin/warehouses")
      .set("Cookie", admin.cookie)
      .send({
        ...warehousePayload(`CD${stamp}`),
        name: `Other ${stamp}`,
        code: `ZX-${stamp}`,
      });
    expect(coded.status).toBe(201);
    tracker.warehouseIds.push(coded.body.data.id);

    const byName = await api()
      .get("/api/v1/admin/warehouses")
      .query({ search: `Warehouse NM${stamp}`, page: 1, limit: 20 })
      .set("Cookie", admin.cookie);
    expect(byName.status).toBe(200);
    const nameItems = byName.body.data.items as Array<{ id: string }>;
    expect(nameItems.some((item) => item.id === named.body.data.id)).toBe(true);
    expect(nameItems.some((item) => item.id === coded.body.data.id)).toBe(false);

    const byCode = await api()
      .get("/api/v1/admin/warehouses")
      .query({ search: `ZX-${stamp}`, page: 1, limit: 1 })
      .set("Cookie", admin.cookie);
    expect(byCode.status).toBe(200);
    const codeItems = byCode.body.data.items as Array<{ id: string; code: string }>;
    expect(codeItems).toHaveLength(1);
    expect(codeItems[0]?.id).toBe(coded.body.data.id);
    expect(byCode.body.data.pagination).toMatchObject({
      page: 1,
      limit: 1,
    });
    expect(byCode.body.data.pagination.total).toBeGreaterThanOrEqual(1);
  });
});
