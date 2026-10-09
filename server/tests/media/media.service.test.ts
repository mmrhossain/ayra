import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadImageFileToCloudinary = vi.fn();
const deleteCloudinaryAsset = vi.fn();
const url = vi.fn();
const mediaAsset = {
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  updateMany: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  count: vi.fn(),
};

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
  },
}));

vi.mock("../../src/common/utils/image-magic.ts", () => ({
  assertAllowedImageStream: vi.fn().mockResolvedValue(undefined),
}));

const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  buildImageUrl,
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
    mediaAsset.findUnique.mockReset();
    mediaAsset.count.mockReset();
    mediaAsset.upsert.mockResolvedValue({});
    mediaAsset.deleteMany.mockResolvedValue({ count: 0 });
    mediaAsset.updateMany.mockResolvedValue({ count: 0 });
    url.mockImplementation(
      (publicId: string, options?: { transformation?: Array<{ width?: number }> }) => {
        const width = options?.transformation?.[0]?.width ?? 0;
        return `https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
      }
    );
  });

  it("uploads a single image without eager transforms and records a pending asset", async () => {
    uploadImageFileToCloudinary.mockResolvedValue(uploadResult("awxvgitg1do5vu2a2xtw"));

    const result = await uploadSingleImage(file, "product", "user-1");

    expect(uploadImageFileToCloudinary).toHaveBeenCalledWith(
      file.path,
      expect.objectContaining({
        asset_folder: "ayra/products",
        unique_filename: true,
        use_filename: false,
        transformation: [
          expect.objectContaining({
            fetch_format: "auto",
            quality: "auto",
            flags: "strip_profile",
          }),
        ],
      })
    );
    expect(result.publicId).toBe("awxvgitg1do5vu2a2xtw");
    expect(result.variants).toHaveLength(1);
    expect(mediaAsset.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: "awxvgitg1do5vu2a2xtw" },
        create: expect.objectContaining({
          status: "PENDING",
          ownerUserId: "user-1",
          type: "product",
        }),
      })
    );
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
  });

  it("builds category hero desktop, hero mobile, and card on-the-fly variants", async () => {
    uploadImageFileToCloudinary.mockResolvedValue(uploadResult("categoryid"));

    const result = await uploadSingleImage(file, "category", "user-1");

    expect(result.publicId).toBe("categoryid");
    expect(result.variants).toHaveLength(2);
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

    const built = buildImageUrl("awxvgitg1do5vu2a2xtw", "product");
    expect(url).toHaveBeenCalled();
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
          status: { in: ["PENDING", "ATTACHED"] },
        },
      })
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.publicId).toBe("libid");
    expect(result.pagination.total).toBe(1);
  });

  it("does not steal MediaAsset ownership when reusing an attached file", async () => {
    await attachMediaAssets(["sharedid"], "product", "product-2");

    const ownerCall = mediaAsset.updateMany.mock.calls[0]?.[0] as {
      where: { OR: unknown };
      data: { entityId: string };
    };
    expect(ownerCall.data.entityId).toBe("product-2");
    expect(ownerCall.where.OR).toEqual(
      expect.arrayContaining([
        { status: "PENDING" },
        { entityType: null },
        { entityId: null },
      ])
    );
  });

  it("does not remove a Cloudinary file from the library on unassign", async () => {
    await detachMediaAssets(["sharedid"]);
    expect(mediaAsset.updateMany).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });
});
