import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadImageFileToCloudinary = vi.fn();
const deleteCloudinaryAsset = vi.fn();
const url = vi.fn();
const mediaAsset = {
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  updateMany: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  count: vi.fn(),
};
const emptyFindMany = () => ({ findMany: vi.fn().mockResolvedValue([]) });
const productImage = emptyFindMany();
const category = emptyFindMany();
const brand = emptyFindMany();
const slider = emptyFindMany();
const blog = emptyFindMany();
const user = emptyFindMany();

vi.mock("../../src/lib/cloudinary.ts", () => ({
  uploadImageFileToCloudinary: (...args: unknown[]) =>
    uploadImageFileToCloudinary(...args),
  deleteCloudinaryAsset: (...args: unknown[]) => deleteCloudinaryAsset(...args),
  cloudinary: {
    url,
  },
}));

vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: {
    mediaAsset,
    productImage,
    category,
    brand,
    slider,
    blog,
    user,
  },
}));

vi.mock("../../src/common/utils/image-magic.ts", () => ({
  assertAllowedImageStream: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/config/env.ts", () => ({
  env: { MEDIA_DB_WRITE_TIMEOUT_MS: 30 },
}));

const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  buildImageUrls,
  purgeExpiredMediaAssets,
  listMediaLibrary,
  attachMediaAssets,
  detachMediaAssets,
} = await import("../../src/modules/media/media.service.ts");

const file = {
  path: "/tmp/media-test.png",
  mimetype: "image/png",
  originalname: "hero.png",
  size: 128,
};

const uploadResult = (publicId: string) => ({
  public_id: publicId,
  url: `http://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
  secure_url: `https://res.cloudinary.com/demo/image/upload/${publicId}.jpg`,
});

describe("media.service", () => {
  beforeEach(() => {
    uploadImageFileToCloudinary.mockReset();
    deleteCloudinaryAsset.mockReset();
    url.mockReset();
    mediaAsset.upsert.mockReset();
    mediaAsset.deleteMany.mockReset();
    mediaAsset.updateMany.mockReset();
    mediaAsset.findMany.mockReset();
    mediaAsset.findFirst.mockReset();
    mediaAsset.findUnique.mockReset();
    mediaAsset.count.mockReset();
    mediaAsset.upsert.mockResolvedValue({});
    mediaAsset.deleteMany.mockResolvedValue({ count: 0 });
    mediaAsset.updateMany.mockResolvedValue({ count: 0 });
    mediaAsset.findMany.mockResolvedValue([]);
    mediaAsset.findFirst.mockResolvedValue(null);
    productImage.findMany.mockResolvedValue([]);
    category.findMany.mockResolvedValue([]);
    brand.findMany.mockResolvedValue([]);
    slider.findMany.mockResolvedValue([]);
    blog.findMany.mockResolvedValue([]);
    user.findMany.mockResolvedValue([]);
    url.mockImplementation(
      (publicId: string, options?: { transformation?: Array<{ width?: number }> }) => {
        const width = options?.transformation?.[0]?.width ?? 0;
        return `https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
      }
    );
  });

  it("uploads a single image without eager transforms and records a pending asset", async () => {
    uploadImageFileToCloudinary.mockImplementation(
      (_path: string, opts: { public_id?: string }) =>
        Promise.resolve(uploadResult(opts.public_id ?? "generated"))
    );

    const result = await uploadSingleImage(file, "product", "user-1");

    expect(uploadImageFileToCloudinary).toHaveBeenCalledWith(
      file.path,
      expect.objectContaining({
        asset_folder: "ayra/products",
        use_filename: false,
        public_id: expect.stringMatching(/^[a-z0-9]{20}$/),
      })
    );
    const publicId = result.publicId;
    expect(publicId).toMatch(/^[a-z0-9]{20}$/);
    expect(result.variants).toHaveLength(1);
    // The pending row uses the same id passed to Cloudinary, written in parallel.
    expect(mediaAsset.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId },
        create: expect.objectContaining({
          status: "PENDING",
          ownerUserId: "user-1",
          type: "product",
        }),
      })
    );
  });

  it("fails fast with 503 when the DB write does not respond", async () => {
    uploadImageFileToCloudinary.mockImplementation(
      (_path: string, opts: { public_id?: string }) =>
        Promise.resolve(uploadResult(opts.public_id ?? "generated"))
    );
    mediaAsset.upsert.mockImplementation(() => new Promise(() => {}));

    await expect(
      uploadSingleImage(file, "product", "user-1")
    ).rejects.toMatchObject({ statusCode: 503 });

    // The asset exists in Cloudinary but could not be tracked, so it is removed.
    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
  });

  it("drops the pending row when the Cloudinary upload fails", async () => {
    uploadImageFileToCloudinary.mockRejectedValue(new Error("boom"));

    await expect(
      uploadSingleImage(file, "product", "user-1")
    ).rejects.toMatchObject({ statusCode: 502 });

    expect(mediaAsset.deleteMany).toHaveBeenCalled();
  });

  it("uploads multiple product images", async () => {
    uploadImageFileToCloudinary
      .mockResolvedValueOnce(uploadResult("prod1id"))
      .mockResolvedValueOnce(uploadResult("prod2id"))
      .mockResolvedValueOnce(uploadResult("prod3id"));

    const results = await uploadMultipleImages([file, file, file], "product", "user-1");
    expect(results).toHaveLength(3);
    expect(results[0]?.publicId).toBe("prod1id");
  });

  it("destroys already uploaded files when one parallel upload fails", async () => {
    uploadImageFileToCloudinary
      .mockResolvedValueOnce(uploadResult("prod1id"))
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce(uploadResult("prod3id"));

    await expect(
      uploadMultipleImages([file, file, file], "product", "user-1")
    ).rejects.toMatchObject({ statusCode: 502 });

    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("prod1id");
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("prod3id");
  });

  it("rejects multiple upload for non-product types", async () => {
    await expect(
      uploadMultipleImages([file], "slider", "user-1")
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("rejects more than 5 product images", async () => {
    const files = Array.from({ length: 6 }, () => file);
    await expect(
      uploadMultipleImages(files, "product", "user-1")
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("builds slider desktop and mobile on-the-fly variants", async () => {
    uploadImageFileToCloudinary.mockResolvedValue(uploadResult("sliderid"));

    const result = await uploadSingleImage(file, "slider", "user-1");

    expect(uploadImageFileToCloudinary).toHaveBeenCalledWith(
      file.path,
      expect.objectContaining({
        asset_folder: "ayra/sliders",
      })
    );
    expect(result.publicId).toBe("sliderid");
    expect(result.variants).toHaveLength(2);
    expect(result.imageUrl).toBe(result.variants[0]);
    expect(result.mobileImageUrl).toBe(result.variants[1]);
  });

  it("builds category hero desktop, hero mobile, and card on-the-fly variants", async () => {
    uploadImageFileToCloudinary.mockResolvedValue(uploadResult("categoryid"));

    const result = await uploadSingleImage(file, "category", "user-1");

    expect(result.publicId).toBe("categoryid");
    expect(result.variants).toHaveLength(2);
    expect(result.imageUrl).toBe(result.variants[0]);
    expect(result.mobileImageUrl).toBe(result.variants[1]);
    const urls = buildImageUrls("categoryid", "category");
    expect(urls).toHaveLength(2);
  });

  it("deletes by publicId and builds a transformation URL", async () => {
    deleteCloudinaryAsset.mockResolvedValue(undefined);
    url.mockReturnValue("https://cdn.example.com/derived.webp");

    await deleteImage("sliders/awxvgitg1do5vu2a2xtw");
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("awxvgitg1do5vu2a2xtw");
    expect(mediaAsset.deleteMany).toHaveBeenCalledWith({
      where: { publicId: "awxvgitg1do5vu2a2xtw" },
    });

    const built = buildImageUrls("awxvgitg1do5vu2a2xtw", "product")[0];
    expect(url).toHaveBeenCalledWith(
      "awxvgitg1do5vu2a2xtw",
      expect.objectContaining({ urlAnalytics: false }),
    );
    expect(built).toContain("derived.webp");
  });

  it("purges PENDING assets older than 24 hours", async () => {
    mediaAsset.findMany.mockResolvedValue([{ publicId: "staleid" }]);
    deleteCloudinaryAsset.mockResolvedValue(undefined);

    const purged = await purgeExpiredMediaAssets();

    expect(purged).toBe(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith("staleid");
    expect(mediaAsset.deleteMany).toHaveBeenCalledWith({
      where: { publicId: "staleid" },
    });

    const query = mediaAsset.findMany.mock.calls[0]?.[0] as {
      where: {
        OR: Array<{
          status: string;
          createdAt?: { lt: Date };
          detachedAt?: { lt: Date };
        }>;
      };
    };
    const pendingClause = query.where.OR.find(
      (clause) => clause.status === "PENDING"
    );
    expect(pendingClause?.createdAt?.lt).toBeInstanceOf(Date);
    const ageMs = Date.now() - (pendingClause?.createdAt?.lt.getTime() ?? 0);
    expect(ageMs).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(ageMs).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it("leaves recent PENDING assets untouched", async () => {
    mediaAsset.findMany.mockResolvedValue([]);

    const purged = await purgeExpiredMediaAssets();

    expect(purged).toBe(0);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it("reattaches PENDING assets still used by a product instead of deleting them", async () => {
    mediaAsset.findMany.mockResolvedValue([{ publicId: "liveid", status: "PENDING" }]);
    productImage.findMany.mockResolvedValue([
      { publicId: "liveid", productId: "prod-1" },
    ]);

    const purged = await purgeExpiredMediaAssets();

    expect(purged).toBe(0);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    expect(mediaAsset.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: "liveid", status: "PENDING" },
        data: expect.objectContaining({
          status: "ATTACHED",
          entityType: "product",
          entityId: "prod-1",
        }),
      })
    );
  });

  it("does not destroy SOFT_DELETED assets still referenced by a product", async () => {
    mediaAsset.findMany.mockResolvedValue([
      { publicId: "softid", status: "SOFT_DELETED" },
    ]);
    productImage.findMany.mockResolvedValue([
      { publicId: "softid", productId: "prod-2" },
    ]);

    const purged = await purgeExpiredMediaAssets();

    expect(purged).toBe(0);
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    expect(mediaAsset.updateMany).not.toHaveBeenCalled();
  });

  it("lists Cloudinary library items of one type, excluding soft-deleted", async () => {
    mediaAsset.count.mockResolvedValue(1);
    mediaAsset.findMany.mockResolvedValue([
      {
        publicId: "libid",
        url: "https://res.cloudinary.com/demo/image/upload/libid.jpg",
        type: "product",
        status: "ATTACHED",
        createdAt: new Date("2026-01-01"),
      },
    ]);

    const result = await listMediaLibrary({ type: "product", page: 1, limit: 24 });

    expect(mediaAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          type: "product",
          OR: [
            { status: "ATTACHED" },
            { status: "PENDING", createdAt: { gte: expect.any(Date) } },
          ],
        },
      })
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.publicId).toBe("libid");
    expect(result.pagination.total).toBe(1);
  });

  it("attaches a pending asset and records the entity", async () => {
    mediaAsset.findMany.mockResolvedValue([
      { publicId: "sharedid", status: "PENDING", entityType: null, entityId: null },
    ]);

    await attachMediaAssets(["sharedid"], "product", "product-2");

    expect(mediaAsset.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: { in: ["sharedid"] }, status: { not: "SOFT_DELETED" } },
        data: expect.objectContaining({
          status: "ATTACHED",
          entityType: "product",
          entityId: "product-2",
        }),
      })
    );
  });

  it("reuses an asset already attached to the same entity", async () => {
    mediaAsset.findMany.mockResolvedValue([
      {
        publicId: "sharedid",
        status: "ATTACHED",
        entityType: "product",
        entityId: "product-2",
      },
    ]);

    await expect(
      attachMediaAssets(["sharedid"], "product", "product-2")
    ).resolves.toBeUndefined();
    expect(mediaAsset.updateMany).toHaveBeenCalled();
  });

  it("rejects attaching an asset claimed by a different entity", async () => {
    mediaAsset.findMany.mockResolvedValue([
      {
        publicId: "sharedid",
        status: "ATTACHED",
        entityType: "product",
        entityId: "product-1",
      },
    ]);

    await expect(
      attachMediaAssets(["sharedid"], "product", "product-2")
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(mediaAsset.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a missing or unowned asset instead of silently no-oping", async () => {
    mediaAsset.findMany.mockResolvedValue([]);

    await expect(
      attachMediaAssets(["ghost"], "product", "product-2")
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(mediaAsset.updateMany).not.toHaveBeenCalled();
  });

  it("scopes attach to the acting owner so a user cannot claim another user's asset", async () => {
    mediaAsset.findMany.mockResolvedValue([
      { publicId: "someone-elses-id", status: "PENDING", entityType: null, entityId: null },
    ]);

    await attachMediaAssets(["someone-elses-id"], "user", "user-1", "user-1");

    expect(mediaAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: { in: ["someone-elses-id"] }, ownerUserId: "user-1" },
      })
    );
    const [args] = mediaAsset.updateMany.mock.calls[0] as [
      { where: { ownerUserId?: string } },
    ];
    expect(args.where.ownerUserId).toBe("user-1");
  });

  it("does not scope attach by owner for trusted admin-managed entities", async () => {
    mediaAsset.findMany.mockResolvedValue([
      { publicId: "brandid", status: "PENDING", entityType: null, entityId: null },
    ]);

    await attachMediaAssets(["brandid"], "brand", "brand-1");

    const [args] = mediaAsset.updateMany.mock.calls[0] as [
      { where: { ownerUserId?: string } },
    ];
    expect(args.where.ownerUserId).toBeUndefined();
  });

  it("does not remove a Cloudinary file from the library on unassign", async () => {
    await detachMediaAssets(["sharedid"]);
    expect(mediaAsset.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          entityType: null,
          entityId: null,
        }),
      }),
    );
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });
});
