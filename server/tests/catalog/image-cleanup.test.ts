import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const deleteCloudinaryAsset = vi.fn().mockResolvedValue(undefined);

vi.mock("../../src/lib/cloudinary.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/cloudinary.ts")>();
  return {
    ...actual,
    deleteCloudinaryAsset: (...args: unknown[]) => deleteCloudinaryAsset(...args),
  };
});

const { prisma } = await import("../../src/lib/prisma.ts");
const { env } = await import("../../src/config/env.ts");
const { CleanupTracker, api, createTestProduct, createTestUser } = await import(
  "../helpers/index.ts"
);

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
  deleteCloudinaryAsset.mockClear();
});

const cloudinaryUrl = (publicId: string) => {
  const cloudName = env.CLOUDINARY_CLOUD_NAME || "demo";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.webp`;
};

const seedAsset = async (publicId: string, ownerUserId: string) => {
  const asset = await prisma.mediaAsset.upsert({
    where: { publicId },
    create: {
      publicId,
      url: cloudinaryUrl(publicId),
      type: "product",
      status: "ATTACHED",
      ownerUserId,
    },
    update: {
      status: "ATTACHED",
      ownerUserId,
      detachedAt: null,
    },
  });
  tracker.mediaAssetIds.push(asset.id);
  return asset;
};

describe("Product image Cloudinary cleanup", () => {
  it("soft-deletes replaced product images after the update transaction commits", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `pimg-up-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    await seedAsset("products/old", admin.id);
    await seedAsset("products/new", admin.id);

    await prisma.productImage.create({
      data: {
        productId: catalog.product.id,
        imageUrl: cloudinaryUrl("products/old"),
        publicId: "products/old",
        isPrimary: true,
        sortOrder: 0,
      },
    });

    const res = await api()
      .put(`/api/v1/admin/products/${catalog.product.id}`)
      .set("Cookie", admin.cookie)
      .send({
        images: [
          {
            imageUrl: cloudinaryUrl("products/new"),
            publicId: "products/new",
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.images[0].publicId).toBe("products/new");
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();

    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "products/old" },
    });
    const newAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "products/new" },
    });
    expect(oldAsset?.status).toBe("SOFT_DELETED");
    expect(newAsset?.status).toBe("ATTACHED");
  });

  it("soft-deletes product images after soft-delete", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `pimg-del-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    await seedAsset("products/gone", admin.id);

    await prisma.productImage.create({
      data: {
        productId: catalog.product.id,
        imageUrl: cloudinaryUrl("products/gone"),
        publicId: "products/gone",
        isPrimary: true,
      },
    });

    const res = await api()
      .delete(`/api/v1/admin/products/${catalog.product.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const asset = await prisma.mediaAsset.findUnique({
      where: { publicId: "products/gone" },
    });
    expect(asset?.status).toBe("SOFT_DELETED");
  });
});

describe("Category image Cloudinary cleanup", () => {
  it("soft-deletes the previous category image on replace", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `cimg-up-${Date.now()}`,
    });
    await seedAsset("categories/old", admin.id);
    await seedAsset("categories/new", admin.id);
    const tag = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: {
        name: `Cat ${tag}`,
        slug: `cat-${tag}`,
        isActive: true,
        image: cloudinaryUrl("categories/old"),
        imagePublicId: "categories/old",
      },
    });
    tracker.categoryIds.push(category.id);

    const res = await api()
      .put(`/api/v1/admin/categories/${category.id}`)
      .set("Cookie", admin.cookie)
      .send({
        image: cloudinaryUrl("categories/new"),
        imagePublicId: "categories/new",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.imagePublicId).toBe("categories/new");
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "categories/old" },
    });
    expect(oldAsset?.status).toBe("SOFT_DELETED");
  });
});

describe("Variant image Cloudinary cleanup", () => {
  it("soft-deletes replaced variant images after the update transaction commits", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `vimg-up-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    await seedAsset("products/variant-old", admin.id);
    await seedAsset("products/variant-new", admin.id);

    await prisma.productImage.create({
      data: {
        productId: catalog.product.id,
        variantId: catalog.variant.id,
        imageUrl: cloudinaryUrl("products/variant-old"),
        publicId: "products/variant-old",
        isPrimary: true,
      },
    });

    const res = await api()
      .put(`/api/v1/admin/variants/${catalog.variant.id}`)
      .set("Cookie", admin.cookie)
      .send({
        images: [
          {
            imageUrl: cloudinaryUrl("products/variant-new"),
            publicId: "products/variant-new",
            isPrimary: true,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "products/variant-old" },
    });
    expect(oldAsset?.status).toBe("SOFT_DELETED");
  });
});

describe("Vendor logo Cloudinary cleanup", () => {
  it("destroys the previous vendor logo on replace", async () => {
    const user = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `vlogo-${Date.now()}`,
    });
    await seedAsset("avatars/vendors/old", user.id);
    await seedAsset("avatars/vendors/new", user.id);

    await prisma.vendorProfile.update({
      where: { userId: user.id },
      data: {
        logo: cloudinaryUrl("avatars/vendors/old"),
        logoPublicId: "avatars/vendors/old",
      },
    });

    const res = await api()
      .patch("/api/v1/vendor/profile")
      .set("Cookie", user.cookie)
      .send({
        logo: cloudinaryUrl("avatars/vendors/new"),
        logoPublicId: "avatars/vendors/new",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.logoPublicId).toBe("avatars/vendors/new");
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("avatars/vendors/old");
  });
});
