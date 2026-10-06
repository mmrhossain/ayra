import { randomUUID } from "node:crypto";
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

describe("Public catalog products", () => {
  it("GET /products returns only published products", async () => {
    const published = await createTestProduct(tracker, { price: 90 });
    const unpublished = await createTestProduct(tracker, { price: 91 });
    await prisma.product.update({
      where: { id: unpublished.product.id },
      data: { status: "DRAFT" },
    });

    const pubRes = await api()
      .get("/api/v1/products")
      .query({ search: published.product.slug, limit: 100 });
    expect(pubRes.status).toBe(200);
    const pubIds = (pubRes.body.data.items as Array<{ id: string }>).map(
      (p) => p.id
    );
    expect(pubIds).toContain(published.product.id);

    const unpubRes = await api()
      .get("/api/v1/products")
      .query({ search: unpublished.product.slug, limit: 100 });
    expect(unpubRes.status).toBe(200);
    const unpubIds = (unpubRes.body.data.items as Array<{ id: string }>).map(
      (p) => p.id
    );
    expect(unpubIds).not.toContain(unpublished.product.id);
  });

  it("includeInactive=true is ignored for unauthenticated requests", async () => {
    const unpublished = await createTestProduct(tracker, { price: 70 });
    await prisma.product.update({
      where: { id: unpublished.product.id },
      data: { status: "DRAFT" },
    });

    const res = await api()
      .get("/api/v1/products")
      .query({
        search: unpublished.product.slug,
        includeInactive: true,
        limit: 100,
      });

    expect(res.status).toBe(200);
    const ids = (res.body.data.items as Array<{ id: string }>).map((p) => p.id);
    expect(ids).not.toContain(unpublished.product.id);
  });

  it("sorts products by variant price, not variant count", async () => {
    const cheap = await createTestProduct(tracker, { price: 15 });
    const expensive = await createTestProduct(tracker, { price: 9000 });

    const extraA = await prisma.productVariant.create({
      data: {
        sku: `SKU-X-${randomUUID().slice(0, 8)}`,
        price: 16,
        isDefault: false,
        productId: cheap.product.id,
      },
    });
    const extraB = await prisma.productVariant.create({
      data: {
        sku: `SKU-Y-${randomUUID().slice(0, 8)}`,
        price: 17,
        isDefault: false,
        productId: cheap.product.id,
      },
    });
    tracker.variantIds.push(extraA.id, extraB.id);

    const asc = await api()
      .get("/api/v1/products")
      .query({ sort: "price_asc", limit: 100 });
    expect(asc.status).toBe(200);
    const ascIds = (asc.body.data.items as Array<{ id: string }>).map(
      (p) => p.id
    );
    const cheapAsc = ascIds.indexOf(cheap.product.id);
    const expensiveAsc = ascIds.indexOf(expensive.product.id);
    expect(cheapAsc).toBeGreaterThanOrEqual(0);
    expect(expensiveAsc).toBeGreaterThanOrEqual(0);
    expect(cheapAsc).toBeLessThan(expensiveAsc);

    const desc = await api()
      .get("/api/v1/products")
      .query({ sort: "price_desc", limit: 100 });
    expect(desc.status).toBe(200);
    const descIds = (desc.body.data.items as Array<{ id: string }>).map(
      (p) => p.id
    );
    const cheapDesc = descIds.indexOf(cheap.product.id);
    const expensiveDesc = descIds.indexOf(expensive.product.id);
    expect(cheapDesc).toBeGreaterThanOrEqual(0);
    expect(expensiveDesc).toBeGreaterThanOrEqual(0);
    expect(expensiveDesc).toBeLessThan(cheapDesc);
  });

  it("featured=true returns only featured products", async () => {
    const featured = await createTestProduct(tracker, { isFeatured: true });
    const regular = await createTestProduct(tracker, { isFeatured: false });

    const res = await api()
      .get("/api/v1/products")
      .query({ featured: true, limit: 100 });

    expect(res.status).toBe(200);
    const ids = (res.body.data.items as Array<{ id: string }>).map((p) => p.id);
    expect(ids).toContain(featured.product.id);
    expect(ids).not.toContain(regular.product.id);
  });

  it("onSale=true returns only products with compareAtPrice above price", async () => {
    const discounted = await createTestProduct(tracker, {
      price: 80,
      compareAtPrice: 120,
    });
    const regular = await createTestProduct(tracker, { price: 90 });

    const res = await api()
      .get("/api/v1/products")
      .query({ onSale: true, limit: 100 });

    expect(res.status).toBe(200);
    const ids = (res.body.data.items as Array<{ id: string }>).map((p) => p.id);
    expect(ids).toContain(discounted.product.id);
    expect(ids).not.toContain(regular.product.id);
  });
});

describe("Product images", () => {
  it("creates a product with multiple images and exactly one primary", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `pimg-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const slug = `multi-img-${randomUUID().slice(0, 8)}`;

    const res = await api()
      .post("/api/v1/admin/products")
      .set("Cookie", admin.cookie)
      .send({
        name: "Multi image product",
        slug,
        categoryId: catalog.category.id,
        images: [
          {
            imageUrl: "https://cdn.example.com/a.webp",
            isPrimary: true,
            sortOrder: 0,
          },
          {
            url: "https://cdn.example.com/b.webp",
            isPrimary: false,
            sortOrder: 1,
          },
        ],
      });

    expect(res.status).toBe(201);
    tracker.productIds.push(res.body.data.id);
    expect(res.body.data.images).toHaveLength(2);
    expect(
      (res.body.data.images as Array<{ isPrimary: boolean }>).filter(
        (image) => image.isPrimary
      )
    ).toHaveLength(1);
  });
});

describe("Product variant generation", () => {
  const createColorSizeAttributes = async () => {
    const tag = randomUUID().slice(0, 8);
    const color = await prisma.attribute.create({ data: { name: `Color-${tag}` } });
    const size = await prisma.attribute.create({ data: { name: `Size-${tag}` } });
    tracker.attributeIds.push(color.id, size.id);

    const red = await prisma.attributeValue.create({
      data: { attributeId: color.id, value: "Red" },
    });
    const blue = await prisma.attributeValue.create({
      data: { attributeId: color.id, value: "Blue" },
    });
    const black = await prisma.attributeValue.create({
      data: { attributeId: color.id, value: "Black" },
    });
    const small = await prisma.attributeValue.create({
      data: { attributeId: size.id, value: "S" },
    });
    const medium = await prisma.attributeValue.create({
      data: { attributeId: size.id, value: "M" },
    });
    const large = await prisma.attributeValue.create({
      data: { attributeId: size.id, value: "L" },
    });
    tracker.attributeValueIds.push(
      red.id,
      blue.id,
      black.id,
      small.id,
      medium.id,
      large.id,
    );

    return { color, size, red, blue, black, small, medium, large };
  };

  it("generates a color x size cartesian matrix with SKUs and inventory", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `gen-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const attrs = await createColorSizeAttributes();
    const slug = `gen-tee-${randomUUID().slice(0, 8)}`;

    const res = await api()
      .post("/api/v1/admin/products")
      .set("Cookie", admin.cookie)
      .send({
        name: "Premium Cotton T-Shirt",
        slug,
        sku: "TSHIRT",
        categoryId: catalog.category.id,
        status: "ACTIVE",
        variantOptions: [
          {
            attributeId: attrs.color.id,
            attributeValueIds: [attrs.red.id, attrs.blue.id, attrs.black.id],
          },
          {
            attributeId: attrs.size.id,
            attributeValueIds: [attrs.small.id, attrs.medium.id, attrs.large.id],
          },
        ],
        variantDefaults: {
          price: 1200,
          compareAtPrice: 1500,
          costPrice: 700,
          weight: 250,
        },
        variantOverrides: [
          {
            attributeValueIds: [attrs.red.id, attrs.large.id],
            price: 1300,
            sku: "TSHIRT-RED-L-CUSTOM",
          },
        ],
      });

    expect(res.status).toBe(201);
    tracker.productIds.push(res.body.data.id);
    const variants = res.body.data.variants as Array<{
      id: string;
      sku: string;
      price: string | number;
      isDefault: boolean;
      availableStock: number;
    }>;
    expect(variants).toHaveLength(9);
    expect(variants.every((variant) => variant.availableStock === 0)).toBe(true);
    expect(variants.filter((variant) => variant.isDefault)).toHaveLength(1);
    expect(variants.some((variant) => variant.sku === "TSHIRT-RED-L-CUSTOM")).toBe(
      true,
    );
    expect(
      variants.some((variant) => Number(variant.price) === 1300),
    ).toBe(true);
    expect(variants.some((variant) => variant.sku === "TSHIRT-RED-S")).toBe(true);
  });

  it("creates a simple product with one default variant when only defaults are provided", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `simple-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const slug = `wallet-${randomUUID().slice(0, 8)}`;

    const res = await api()
      .post("/api/v1/admin/products")
      .set("Cookie", admin.cookie)
      .send({
        name: "Leather Wallet",
        slug,
        categoryId: catalog.category.id,
        variantDefaults: { price: 900 },
      });

    expect(res.status).toBe(201);
    tracker.productIds.push(res.body.data.id);
    expect(res.body.data.status).toBe("DRAFT");
    expect(res.body.data.variants).toHaveLength(1);
    expect(res.body.data.variants[0].isDefault).toBe(true);
    expect(res.body.data.variants[0].sku).toBe("LEATHER-WALLET-DEFAULT");
  });

  it("rejects attribute values that belong to a different attribute", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `badattr-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const attrs = await createColorSizeAttributes();

    const res = await api()
      .post("/api/v1/admin/products")
      .set("Cookie", admin.cookie)
      .send({
        name: "Bad combo",
        slug: `bad-combo-${randomUUID().slice(0, 8)}`,
        categoryId: catalog.category.id,
        variantOptions: [
          {
            attributeId: attrs.size.id,
            attributeValueIds: [attrs.red.id],
          },
        ],
        variantDefaults: { price: 1000 },
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not belong/);
  });

  it("admin can filter by DRAFT ACTIVE and ARCHIVED", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `stfilter-${Date.now()}`,
    });
    const draft = await createTestProduct(tracker);
    const archived = await createTestProduct(tracker);
    await prisma.product.update({
      where: { id: draft.product.id },
      data: { status: "DRAFT" },
    });
    await prisma.product.update({
      where: { id: archived.product.id },
      data: { status: "ARCHIVED" },
    });

    const draftRes = await api()
      .get("/api/v1/products")
      .query({ status: "DRAFT", search: draft.product.slug, limit: 100 })
      .set("Cookie", admin.cookie);
    expect(draftRes.status).toBe(200);
    expect(
      (draftRes.body.data.items as Array<{ id: string }>).map((p) => p.id),
    ).toContain(draft.product.id);

    const archivedRes = await api()
      .get("/api/v1/products")
      .query({ status: "ARCHIVED", search: archived.product.slug, limit: 100 })
      .set("Cookie", admin.cookie);
    expect(archivedRes.status).toBe(200);
    expect(
      (archivedRes.body.data.items as Array<{ id: string }>).map((p) => p.id),
    ).toContain(archived.product.id);

    const publicArchived = await api()
      .get("/api/v1/products")
      .query({ search: archived.product.slug, limit: 100 });
    expect(
      (publicArchived.body.data.items as Array<{ id: string }>).map((p) => p.id),
    ).not.toContain(archived.product.id);
  });
});

describe("Catalog authorization", () => {
  it("forbids product create without admin or vendor role", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `cust-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);

    const unauth = await api().post("/api/v1/admin/products").send({
      name: "Nope",
      slug: `nope-${randomUUID().slice(0, 8)}`,
      categoryId: catalog.category.id,
    });
    expect([401, 403]).toContain(unauth.status);

    const res = await api()
      .post("/api/v1/admin/products")
      .set("Cookie", customer.cookie)
      .send({
        name: "Nope",
        slug: `nope-${randomUUID().slice(0, 8)}`,
        categoryId: catalog.category.id,
      });
    expect(res.status).toBe(403);
  });

  it("admin GET product by id includes unpublished products", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `adm-get-${Date.now()}`,
    });
    const unpublished = await createTestProduct(tracker, { price: 55 });
    await prisma.product.update({
      where: { id: unpublished.product.id },
      data: { status: "DRAFT" },
    });

    const publicRes = await api().get(
      `/api/v1/products/${unpublished.product.slug}`
    );
    expect(publicRes.status).toBe(404);

    const adminRes = await api()
      .get(`/api/v1/admin/products/${unpublished.product.id}`)
      .set("Cookie", admin.cookie);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.id).toBe(unpublished.product.id);
    expect(adminRes.body.data.status).toBe("DRAFT");
  });

  it("admin list includeInactive returns status and availableStock", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `adm-list-${Date.now()}`,
    });
    const unpublished = await createTestProduct(tracker, { stock: 4, price: 80 });
    await prisma.product.update({
      where: { id: unpublished.product.id },
      data: { status: "DRAFT" },
    });

    const res = await api()
      .get("/api/v1/products")
      .query({
        search: unpublished.product.slug,
        includeInactive: true,
        limit: 100,
      })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const item = (
      res.body.data.items as Array<{
        id: string;
        status: string;
        variants: Array<{ availableStock: number }>;
      }>
    ).find((p) => p.id === unpublished.product.id);
    expect(item).toBeTruthy();
    expect(item?.status).toBe("DRAFT");
    expect(item?.variants[0]?.availableStock).toBe(4);
  });

  it("admin GET product by id includes variant attributes", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `adm-attr-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const tag = randomUUID().slice(0, 8);
    const attribute = await prisma.attribute.create({
      data: { name: `Size-${tag}` },
    });
    const value = await prisma.attributeValue.create({
      data: { attributeId: attribute.id, value: "M" },
    });
    await prisma.variantAttribute.create({
      data: {
        variantId: catalog.variant.id,
        attributeValueId: value.id,
      },
    });

    const res = await api()
      .get(`/api/v1/admin/products/${catalog.product.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const variant = (
      res.body.data.variants as Array<{
        id: string;
        attributes: Array<{ attributeValue: { id: string; value: string } }>;
      }>
    ).find((v) => v.id === catalog.variant.id);
    expect(variant?.attributes[0]?.attributeValue.id).toBe(value.id);
    expect(variant?.attributes[0]?.attributeValue.value).toBe("M");
    expect(variant?.attributes[0]?.attributeValue.attributeId).toBe(attribute.id);
    expect(variant?.attributes[0]?.attributeValue.attribute?.name).toBe(
      `Size-${tag}`
    );

    const publicRes = await api().get(
      `/api/v1/products/${catalog.product.slug}`
    );
    expect(publicRes.status).toBe(200);
    const publicVariant = (
      publicRes.body.data.variants as Array<{
        id: string;
        isDefault: boolean;
        attributes: Array<{
          attributeValue: {
            id: string;
            value: string;
            attributeId: string;
            attribute?: { id: string; name: string };
          };
        }>;
      }>
    ).find((v) => v.id === catalog.variant.id);
    expect(publicVariant?.isDefault).toBe(true);
    expect(publicVariant?.attributes[0]?.attributeValue.attributeId).toBe(
      attribute.id
    );
  });

  it("forbids vendor product POST/PUT/DELETE (admin-only CUD)", async () => {
    const vendor = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `vend-cud-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);

    const createRes = await api()
      .post("/api/v1/admin/products")
      .set("Cookie", vendor.cookie)
      .send({
        name: "Vendor product",
        slug: `vendor-${randomUUID().slice(0, 8)}`,
        categoryId: catalog.category.id,
      });
    expect(createRes.status).toBe(403);

    const updateRes = await api()
      .put(`/api/v1/admin/products/${catalog.product.id}`)
      .set("Cookie", vendor.cookie)
      .send({ name: "Hijack" });
    expect(updateRes.status).toBe(403);

    const deleteRes = await api()
      .delete(`/api/v1/admin/products/${catalog.product.id}`)
      .set("Cookie", vendor.cookie);
    expect(deleteRes.status).toBe(403);
  });

  it("rejects inventory adjustment from non-admin", async () => {
    const catalog = await createTestProduct(tracker, { stock: 5 });
    const customer = await createTestUser(tracker, {
      suffix: `invc-${Date.now()}`,
    });
    const vendor = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `invv-${Date.now()}`,
    });
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `inva-${Date.now()}`,
    });

    const body = {
      warehouseId: catalog.warehouse.id,
      variantId: catalog.variant.id,
      difference: 1,
      reason: "test adjustment",
    };

    const customerRes = await api()
      .post("/api/v1/admin/inventory/adjustments")
      .set("Cookie", customer.cookie)
      .send(body);
    expect(customerRes.status).toBe(403);

    const vendorRes = await api()
      .post("/api/v1/admin/inventory/adjustments")
      .set("Cookie", vendor.cookie)
      .send(body);
    expect(vendorRes.status).toBe(403);

    const adminList = await api()
      .get("/api/v1/admin/inventory")
      .set("Cookie", admin.cookie);
    expect(adminList.status).toBe(200);
  });
});

describe("Variant inventory bootstrap", () => {
  it("auto-creates a zero-stock inventory row when a variant is created", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `varinv-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const sku = `SKU-AUTO-${randomUUID().slice(0, 8)}`;

    const res = await api()
      .post(`/api/v1/admin/products/${catalog.product.id}/variants`)
      .set("Cookie", admin.cookie)
      .send({
        sku,
        price: 120,
        isDefault: false,
      });

    expect(res.status).toBe(201);
    tracker.variantIds.push(res.body.data.id);

    const inventory = await prisma.inventory.findFirst({
      where: { variantId: res.body.data.id },
    });
    expect(inventory).not.toBeNull();
    expect(inventory?.warehouseId).toBe(catalog.warehouse.id);
    expect(inventory?.quantityOnHand).toBe(0);
    expect(inventory?.quantityReserved).toBe(0);
    expect(inventory?.quantityAvailable).toBe(0);
  });

  it("rejects variant creation when no active warehouse exists", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `nowh-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const sku = `SKU-NOWH-${randomUUID().slice(0, 8)}`;

    const activeWarehouses = await prisma.warehouse.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    await prisma.warehouse.updateMany({
      where: { id: { in: activeWarehouses.map((w) => w.id) } },
      data: { isActive: false },
    });

    try {
      const res = await api()
        .post(`/api/v1/admin/products/${catalog.product.id}/variants`)
        .set("Cookie", admin.cookie)
        .send({
          sku,
          price: 120,
          isDefault: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "No active warehouse found — create a warehouse first"
      );

      const created = await prisma.productVariant.findUnique({ where: { sku } });
      expect(created).toBeNull();
    } finally {
      await prisma.warehouse.updateMany({
        where: { id: { in: activeWarehouses.map((w) => w.id) } },
        data: { isActive: true },
      });
    }
  });

  it("clears other default variants when creating a default variant", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `defcreate-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const sku = `SKU-DEF-${randomUUID().slice(0, 8)}`;

    const res = await api()
      .post(`/api/v1/admin/products/${catalog.product.id}/variants`)
      .set("Cookie", admin.cookie)
      .send({
        sku,
        price: 150,
        isDefault: true,
      });

    expect(res.status).toBe(201);
    tracker.variantIds.push(res.body.data.id);
    expect(res.body.data.isDefault).toBe(true);

    const previous = await prisma.productVariant.findUniqueOrThrow({
      where: { id: catalog.variant.id },
    });
    expect(previous.isDefault).toBe(false);
  });

  it("clears other default variants when updating a variant to default", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `defupd-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const sku = `SKU-UPDDEF-${randomUUID().slice(0, 8)}`;

    const created = await api()
      .post(`/api/v1/admin/products/${catalog.product.id}/variants`)
      .set("Cookie", admin.cookie)
      .send({
        sku,
        price: 150,
        isDefault: false,
      });
    expect(created.status).toBe(201);
    tracker.variantIds.push(created.body.data.id);

    const updated = await api()
      .put(`/api/v1/admin/variants/${created.body.data.id}`)
      .set("Cookie", admin.cookie)
      .send({ isDefault: true });

    expect(updated.status).toBe(200);
    expect(updated.body.data.isDefault).toBe(true);

    const previous = await prisma.productVariant.findUniqueOrThrow({
      where: { id: catalog.variant.id },
    });
    expect(previous.isDefault).toBe(false);
  });

  it("promotes another variant to default when the default variant is deleted", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `defdel-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    const sku = `SKU-KEEP-${randomUUID().slice(0, 8)}`;

    const created = await api()
      .post(`/api/v1/admin/products/${catalog.product.id}/variants`)
      .set("Cookie", admin.cookie)
      .send({
        sku,
        price: 150,
        isDefault: false,
      });
    expect(created.status).toBe(201);
    tracker.variantIds.push(created.body.data.id);

    const deleted = await api()
      .delete(`/api/v1/admin/variants/${catalog.variant.id}`)
      .set("Cookie", admin.cookie);
    expect(deleted.status).toBe(200);

    const remaining = await prisma.productVariant.findUniqueOrThrow({
      where: { id: created.body.data.id },
    });
    expect(remaining.isDefault).toBe(true);
  });
});

describe("Category delete", () => {
  it("soft-deletes a category that has a child category", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `cat-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);

    const parent = await prisma.category.create({
      data: { name: `Parent ${tag}`, slug: `parent-${tag}`, isActive: true },
    });
    tracker.categoryIds.push(parent.id);

    const child = await prisma.category.create({
      data: {
        name: `Child ${tag}`,
        slug: `child-${tag}`,
        isActive: true,
        parentId: parent.id,
      },
    });
    tracker.categoryIds.push(child.id);

    const res = await api()
      .delete(`/api/v1/admin/categories/${parent.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const deleted = await prisma.category.findUniqueOrThrow({
      where: { id: parent.id },
    });
    expect(deleted.deletedAt).not.toBeNull();

    const remainingChild = await prisma.category.findUniqueOrThrow({
      where: { id: child.id },
    });
    expect(remainingChild.deletedAt).toBeNull();
  });

  it("soft-deletes a category that still has products", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `catp-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);

    const res = await api()
      .delete(`/api/v1/admin/categories/${catalog.category.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const deleted = await prisma.category.findUniqueOrThrow({
      where: { id: catalog.category.id },
    });
    expect(deleted.deletedAt).not.toBeNull();
  });
});

describe("Unique field race handling", () => {
  it("returns 409 when creating a product with a duplicate slug", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `slug-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);

    const res = await api()
      .post("/api/v1/admin/products")
      .set("Cookie", admin.cookie)
      .send({
        name: "Duplicate slug product",
        slug: catalog.product.slug,
        categoryId: catalog.category.id,
        status: "DRAFT",
        isFeatured: false,
      });

    expect(res.status).toBe(409);
  });
});
