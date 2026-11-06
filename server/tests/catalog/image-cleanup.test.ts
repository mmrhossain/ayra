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

const seedAsset = async (
  publicId: string,
  ownerUserId: string,
  type = "product"
) => {
  const asset = await prisma.mediaAsset.upsert({
    where: { publicId },
    create: {
      publicId,
      url: cloudinaryUrl(publicId),
      type,
      status: "PENDING",
      ownerUserId,
    },
    update: {
      status: "PENDING",
      ownerUserId,
      detachedAt: null,
      type,
      entityType: null,
      entityId: null,
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
    await seedAsset("oldid", admin.id);
    await seedAsset("newid", admin.id);

    await prisma.productImage.create({
      data: {
        productId: catalog.product.id,
        imageUrl: cloudinaryUrl("oldid"),
        publicId: "oldid",
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
            imageUrl: cloudinaryUrl("newid"),
            publicId: "newid",
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.images[0].publicId).toBe("newid");
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();

    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "oldid" },
    });
    const newAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "newid" },
    });
    expect(oldAsset?.status).toBe("PENDING");
    expect(newAsset?.status).toBe("ATTACHED");
  });

  it("soft-deletes product images after soft-delete", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `pimg-del-${Date.now()}`,
    });
    const catalog = await createTestProduct(tracker);
    await seedAsset("goneid", admin.id);

    await prisma.productImage.create({
      data: {
        productId: catalog.product.id,
        imageUrl: cloudinaryUrl("goneid"),
        publicId: "goneid",
        isPrimary: true,
      },
    });

    const res = await api()
      .delete(`/api/v1/admin/products/${catalog.product.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const asset = await prisma.mediaAsset.findUnique({
      where: { publicId: "goneid" },
    });
    expect(asset?.status).toBe("PENDING");
  });
});

describe("Category image Cloudinary cleanup", () => {
  it("soft-deletes the previous category image on replace", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `cimg-up-${Date.now()}`,
    });
    await seedAsset("catoldid", admin.id);
    await seedAsset("catnewid", admin.id);
    const tag = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: {
        name: `Cat ${tag}`,
        slug: `cat-${tag}`,
        isActive: true,
        image: cloudinaryUrl("catoldid"),
        imagePublicId: "catoldid",
      },
    });
    tracker.categoryIds.push(category.id);

    const res = await api()
      .put(`/api/v1/admin/categories/${category.id}`)
      .set("Cookie", admin.cookie)
      .send({
        image: cloudinaryUrl("catnewid"),
        imagePublicId: "catnewid",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.imagePublicId).toBe("catnewid");
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "catoldid" },
    });
    expect(oldAsset?.status).toBe("PENDING");
  });

  it("clears the category image when edit sends a null image", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `cimg-rm-${Date.now()}`,
    });
    await seedAsset("catremoveid", admin.id);
    const tag = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: {
        name: `Cat ${tag}`,
        slug: `cat-${tag}`,
        isActive: true,
        image: cloudinaryUrl("catremoveid"),
        imagePublicId: "catremoveid",
      },
    });
    tracker.categoryIds.push(category.id);

    const res = await api()
      .put(`/api/v1/admin/categories/${category.id}`)
      .set("Cookie", admin.cookie)
      .send({
        image: null,
        imagePublicId: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.image).toBeNull();
    expect(res.body.data.imagePublicId).toBeNull();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "catremoveid" },
    });
    expect(oldAsset?.status).toBe("PENDING");
  });
});

describe("Blog featured image Cloudinary cleanup", () => {
  it("soft-deletes the previous blog image on replace", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `bimg-up-${Date.now()}`,
    });
    await seedAsset("blogoldid", admin.id);
    await seedAsset("blognewid", admin.id);
    const tag = randomUUID().slice(0, 8);
    const post = await prisma.blog.create({
      data: {
        title: `Post ${tag}`,
        slug: `blog-${tag}`,
        content: `<p>${tag}</p>`,
        featuredImage: cloudinaryUrl("blogoldid"),
        featuredImagePublicId: "blogoldid",
      },
    });
    tracker.blogIds.push(post.id);

    const res = await api()
      .put(`/api/v1/admin/blogs/${post.id}`)
      .set("Cookie", admin.cookie)
      .send({
        featuredImage: cloudinaryUrl("blognewid"),
        featuredImagePublicId: "blognewid",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.featuredImagePublicId).toBe("blognewid");
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "blogoldid" },
    });
    expect(oldAsset?.status).toBe("PENDING");
  });

  it("clears the blog image when edit sends a null featured image", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `bimg-rm-${Date.now()}`,
    });
    await seedAsset("blogremoveid", admin.id);
    const tag = randomUUID().slice(0, 8);
    const post = await prisma.blog.create({
      data: {
        title: `Post ${tag}`,
        slug: `blog-rm-${tag}`,
        content: `<p>${tag}</p>`,
        featuredImage: cloudinaryUrl("blogremoveid"),
        featuredImagePublicId: "blogremoveid",
      },
    });
    tracker.blogIds.push(post.id);

    const res = await api()
      .put(`/api/v1/admin/blogs/${post.id}`)
      .set("Cookie", admin.cookie)
      .send({
        featuredImage: null,
        featuredImagePublicId: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.featuredImage).toBeNull();
    expect(res.body.data.featuredImagePublicId).toBeNull();
    const oldAsset = await prisma.mediaAsset.findUnique({
      where: { publicId: "blogremoveid" },
    });
    expect(oldAsset?.status).toBe("PENDING");
  });
});

describe("Media library reuse", () => {
  it("returns a replaced Cloudinary file to the library so another category can reuse it", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `reuse-${Date.now()}`,
    });
    await seedAsset("sharedcatid", admin.id, "category");
    await seedAsset("replacementcatid", admin.id, "category");
    const tag = randomUUID().slice(0, 8);
    const first = await api()
      .post("/api/v1/admin/categories")
      .set("Cookie", admin.cookie)
      .send({
        name: `Cat A ${tag}`,
        isActive: true,
        image: cloudinaryUrl("sharedcatid"),
        imagePublicId: "sharedcatid",
      });
    expect(first.status).toBe(201);
    tracker.categoryIds.push(first.body.data.id);

    const res = await api()
      .put(`/api/v1/admin/categories/${first.body.data.id}`)
      .set("Cookie", admin.cookie)
      .send({
        image: cloudinaryUrl("replacementcatid"),
        imagePublicId: "replacementcatid",
      });

    expect(res.status).toBe(200);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    const shared = await prisma.mediaAsset.findUnique({
      where: { publicId: "sharedcatid" },
    });
    expect(shared?.status).toBe("PENDING");

    const second = await api()
      .post("/api/v1/admin/categories")
      .set("Cookie", admin.cookie)
      .send({
        name: `Cat B ${tag}`,
        isActive: true,
        image: cloudinaryUrl("sharedcatid"),
        imagePublicId: "sharedcatid",
      });
    expect(second.status).toBe(201);
    tracker.categoryIds.push(second.body.data.id);
    const reused = await prisma.mediaAsset.findUnique({
      where: { publicId: "sharedcatid" },
    });
    expect(reused?.status).toBe("ATTACHED");
    expect(reused?.entityId).toBe(second.body.data.id);
  });
});
