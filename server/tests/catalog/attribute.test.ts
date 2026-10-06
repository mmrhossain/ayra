import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const tracker = new CleanupTracker();
const attributeIds: string[] = [];

afterEach(async () => {
  if (attributeIds.length) {
    await prisma.attributeValue.deleteMany({
      where: { attributeId: { in: attributeIds } },
    });
    await prisma.attribute.deleteMany({ where: { id: { in: attributeIds } } });
    attributeIds.length = 0;
  }
  await tracker.cleanup();
});

describe("Attribute CRUD", () => {
  it("lists attributes publicly without auth", async () => {
    const res = await api().get("/api/v1/attributes");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("forbids vendor attribute mutations", async () => {
    const vendor = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `attrv-${Date.now()}`,
    });

    const res = await api()
      .post("/api/v1/admin/attributes")
      .set("Cookie", vendor.cookie)
      .send({ name: `Color-${randomUUID().slice(0, 8)}` });

    expect(res.status).toBe(403);
  });

  it("admin can create, update, nest values, and delete attributes", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `attra-${Date.now()}`,
    });
    const name = `Size-${randomUUID().slice(0, 8)}`;

    const created = await api()
      .post("/api/v1/admin/attributes")
      .set("Cookie", admin.cookie)
      .send({ name });
    expect(created.status).toBe(201);
    const attributeId = created.body.data.id as string;
    attributeIds.push(attributeId);

    const renamed = await api()
      .put(`/api/v1/admin/attributes/${attributeId}`)
      .set("Cookie", admin.cookie)
      .send({ name: `${name}-XL` });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.name).toBe(`${name}-XL`);

    const value = await api()
      .post(`/api/v1/admin/attributes/${attributeId}/values`)
      .set("Cookie", admin.cookie)
      .send({ value: "XL" });
    expect(value.status).toBe(201);
    const valueId = value.body.data.id as string;

    const updatedValue = await api()
      .put(`/api/v1/admin/attribute-values/${valueId}`)
      .set("Cookie", admin.cookie)
      .send({ value: "XXL" });
    expect(updatedValue.status).toBe(200);
    expect(updatedValue.body.data.value).toBe("XXL");

    const colorName = `Color-${randomUUID().slice(0, 8)}`;
    const colorAttr = await api()
      .post("/api/v1/admin/attributes")
      .set("Cookie", admin.cookie)
      .send({ name: colorName });
    expect(colorAttr.status).toBe(201);
    const colorAttrId = colorAttr.body.data.id as string;
    attributeIds.push(colorAttrId);

    const colorValue = await api()
      .post(`/api/v1/admin/attributes/${colorAttrId}/values`)
      .set("Cookie", admin.cookie)
      .send({ value: "Crimson", color: "#dc143c" });
    expect(colorValue.status).toBe(201);
    expect(colorValue.body.data.color).toBe("#DC143C");

    const colorValueId = colorValue.body.data.id as string;
    const updatedColor = await api()
      .put(`/api/v1/admin/attribute-values/${colorValueId}`)
      .set("Cookie", admin.cookie)
      .send({ color: "#111111" });
    expect(updatedColor.status).toBe(200);
    expect(updatedColor.body.data.color).toBe("#111111");

    const invalidColor = await api()
      .post(`/api/v1/admin/attributes/${colorAttrId}/values`)
      .set("Cookie", admin.cookie)
      .send({ value: "Bad", color: "red" });
    expect(invalidColor.status).toBe(400);

    const deletedValue = await api()
      .delete(`/api/v1/admin/attribute-values/${valueId}`)
      .set("Cookie", admin.cookie);
    expect(deletedValue.status).toBe(200);

    const deleted = await api()
      .delete(`/api/v1/admin/attributes/${attributeId}`)
      .set("Cookie", admin.cookie);
    expect(deleted.status).toBe(200);
  });
});
