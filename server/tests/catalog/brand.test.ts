import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../../src/config/env.ts";
import { prisma } from "../../src/lib/prisma.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const deleteCloudinaryAsset = vi.fn().mockResolvedValue(undefined);

vi.mock("../../src/lib/cloudinary.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/cloudinary.ts")>();
  return {
    ...actual,
    deleteCloudinaryAsset: (...args: unknown[]) => deleteCloudinaryAsset(...args),
  };
});

const tracker = new CleanupTracker();
const cloudName = env.CLOUDINARY_CLOUD_NAME || "demo";
const logoUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,f_webp/brandid.webp`;

afterEach(async () => {
  await tracker.cleanup();
  deleteCloudinaryAsset.mockClear();
});

const trackBrand = (body: { data?: { id?: string } }) => {
  if (body?.data?.id) tracker.brandIds.push(body.data.id);
};

const seedBrandAsset = async (publicId: string, ownerUserId: string) => {
  const asset = await prisma.mediaAsset.upsert({
    where: { publicId },
    create: {
      publicId,
      url: logoUrl,
      type: "brand",
      status: "PENDING",
      ownerUserId,
    },
    update: {
      status: "PENDING",
      ownerUserId,
      detachedAt: null,
      type: "brand",
      entityType: null,
      entityId: null,
    },
  });
  tracker.mediaAssetIds.push(asset.id);
  return asset;
};

const createBrandRow = async (data: {
  name: string;
  slug: string;
  isActive?: boolean;
  deletedAt?: Date | null;
}) => {
  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      slug: data.slug,
      isActive: data.isActive ?? true,
      deletedAt: data.deletedAt ?? null,
    },
  });
  tracker.brandIds.push(brand.id);
  return brand;
};

describe("Public brands", () => {
  it("returns non-deleted brands including inactive", async () => {
    const tag = randomUUID().slice(0, 8);
    const active = await createBrandRow({
      name: `Active ${tag}`,
      slug: `active-${tag}`,
    });
    const inactive = await createBrandRow({
      name: `Inactive ${tag}`,
      slug: `inactive-${tag}`,
      isActive: false,
    });
    const deleted = await createBrandRow({
      name: `Deleted ${tag}`,
      slug: `deleted-${tag}`,
      deletedAt: new Date(),
    });

    const res = await api().get("/api/v1/brands");
    expect(res.status).toBe(200);
    const items = res.body.data as Array<{ id: string }>;
    const ids = items.map((item) => item.id);
    expect(ids).toContain(active.id);
    expect(ids).toContain(inactive.id);
    expect(ids).not.toContain(deleted.id);
  });
});

describe("Admin brands", () => {
  it("rejects unauthenticated list", async () => {
    const res = await api().get("/api/v1/admin/brands");
    expect(res.status).toBe(401);
  });

  it("paginates, searches by name case-insensitively, includes inactive, excludes soft-deleted", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `brl-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    const matchActive = await createBrandRow({
      name: `Nova ${tag}`,
      slug: `nova-${tag}`,
    });
    const matchInactive = await createBrandRow({
      name: `nova mill ${tag}`,
      slug: `nova-mill-${tag}`,
      isActive: false,
    });
    const other = await createBrandRow({
      name: `Other ${tag}`,
      slug: `other-${tag}`,
    });
    const deleted = await createBrandRow({
      name: `Nova gone ${tag}`,
      slug: `nova-gone-${tag}`,
      deletedAt: new Date(),
    });

    const res = await api()
      .get("/api/v1/admin/brands")
      .set("Cookie", admin.cookie)
      .query({ search: "NOVA", page: 1, limit: 20 });

    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 20,
    });
    const items = res.body.data.items as Array<{ id: string; isActive: boolean }>;
    const ids = items.map((item) => item.id);
    expect(ids).toContain(matchActive.id);
    expect(ids).toContain(matchInactive.id);
    expect(ids).not.toContain(other.id);
    expect(ids).not.toContain(deleted.id);
    expect(items.find((item) => item.id === matchInactive.id)?.isActive).toBe(false);
  });

  it("creates a brand with a generated slug when omitted", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `brc-${Date.now()}`,
    });
    const name = `Ayra Studio ${randomUUID().slice(0, 8)}`;

    const res = await api()
      .post("/api/v1/admin/brands")
      .set("Cookie", admin.cookie)
      .send({ name });

    expect(res.status).toBe(201);
    trackBrand(res.body);
    expect(res.body.data.name).toBe(name);
    expect(res.body.data.slug).toMatch(/^ayra-studio-/);
  });

  it("returns 409 on live slug collision", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `brs-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    await createBrandRow({
      name: `Taken ${tag}`,
      slug: `taken-${tag}`,
    });

    const res = await api()
      .post("/api/v1/admin/brands")
      .set("Cookie", admin.cookie)
      .send({ name: `Other ${tag}`, slug: `taken-${tag}` });

    expect(res.status).toBe(409);
  });

  it("updates a unique slug and clears logo with nulls", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `bru-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    await seedBrandAsset("brandid", admin.id);
    const created = await api()
      .post("/api/v1/admin/brands")
      .set("Cookie", admin.cookie)
      .send({
        name: `Logo ${tag}`,
        slug: `logo-${tag}`,
        logo: logoUrl,
        logoPublicId: "brandid",
      });
    expect(created.status).toBe(201);
    trackBrand(created.body);
    const id = created.body.data.id as string;

    const updated = await api()
      .put(`/api/v1/admin/brands/${id}`)
      .set("Cookie", admin.cookie)
      .send({
        slug: `logo-new-${tag}`,
        logo: null,
        logoPublicId: null,
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data.slug).toBe(`logo-new-${tag}`);
    expect(updated.body.data.logo).toBeNull();
    expect(updated.body.data.logoPublicId).toBeNull();
  });

  it("returns 409 when updating to a live slug", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `brcu-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    await createBrandRow({
      name: `First ${tag}`,
      slug: `first-${tag}`,
    });
    const second = await createBrandRow({
      name: `Second ${tag}`,
      slug: `second-${tag}`,
    });

    const res = await api()
      .put(`/api/v1/admin/brands/${second.id}`)
      .set("Cookie", admin.cookie)
      .send({ slug: `first-${tag}` });

    expect(res.status).toBe(409);
  });

  it("soft-deletes a brand with no products", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `brd-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    const brand = await createBrandRow({
      name: `Gone ${tag}`,
      slug: `gone-${tag}`,
    });

    const res = await api()
      .delete(`/api/v1/admin/brands/${brand.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const stored = await prisma.brand.findUnique({ where: { id: brand.id } });
    expect(stored?.deletedAt).not.toBeNull();
  });

  it("returns 409 when live products still reference the brand", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `brp-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);
    const brand = await createBrandRow({
      name: `Linked ${tag}`,
      slug: `linked-${tag}`,
    });
    const category = await prisma.category.create({
      data: {
        name: `Cat ${tag}`,
        slug: `cat-${tag}`,
        isActive: true,
      },
    });
    tracker.categoryIds.push(category.id);
    const product = await prisma.product.create({
      data: {
        name: `Product ${tag}`,
        slug: `product-${tag}`,
        status: "ACTIVE",
        categoryId: category.id,
        brandId: brand.id,
      },
    });
    tracker.productIds.push(product.id);

    const res = await api()
      .delete(`/api/v1/admin/brands/${brand.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(409);
    const stored = await prisma.brand.findUnique({ where: { id: brand.id } });
    expect(stored?.deletedAt).toBeNull();
  });
});
