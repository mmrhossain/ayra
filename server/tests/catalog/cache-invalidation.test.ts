import { beforeEach, describe, expect, it, vi } from "vitest";

const { redisDel, findMany } = vi.hoisted(() => ({
  redisDel: vi.fn(async (_key: string) => {}),
  findMany: vi.fn(async () => [] as Array<{ product: { slug: string } }>),
}));

vi.mock("../../src/lib/redis.ts", () => ({
  redisDel,
  redisGet: vi.fn(async () => null),
  redisSet: vi.fn(async () => {}),
  redis: null,
}));

vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: { productVariant: { findMany } },
}));

const { CacheKeys, invalidateCatalogCacheForVariants } = await import(
  "../../src/lib/cache.ts"
);

const deletedKeys = () => redisDel.mock.calls.map(([key]) => key);

const baseKeys = () => [
  CacheKeys.home,
  CacheKeys.categoryTree(false),
  CacheKeys.categoryTree(true),
  CacheKeys.brands,
];

describe("invalidateCatalogCacheForVariants", () => {
  beforeEach(() => {
    redisDel.mockClear();
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it("drops base catalog keys plus the owning product slug", async () => {
    findMany.mockResolvedValueOnce([{ product: { slug: "classic-tee" } }]);

    await invalidateCatalogCacheForVariants(["variant-1"]);

    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ["variant-1"] } },
      select: { product: { select: { slug: true } } },
    });
    expect(deletedKeys()).toEqual(
      expect.arrayContaining([
        ...baseKeys(),
        CacheKeys.productSlug("classic-tee"),
      ]),
    );
  });

  it("deduplicates slug keys when several variants share a product", async () => {
    findMany.mockResolvedValueOnce([
      { product: { slug: "shared" } },
      { product: { slug: "shared" } },
    ]);

    await invalidateCatalogCacheForVariants(["v1", "v2"]);

    expect(
      deletedKeys().filter((key) => key === CacheKeys.productSlug("shared")),
    ).toHaveLength(1);
  });

  it("only removes base keys and skips the lookup when no ids are supplied", async () => {
    await invalidateCatalogCacheForVariants([null, undefined]);

    expect(findMany).not.toHaveBeenCalled();
    expect(deletedKeys().sort()).toEqual([...baseKeys()].sort());
  });

  it("ignores blank ids when building the lookup", async () => {
    findMany.mockResolvedValueOnce([{ product: { slug: "tee" } }]);

    await invalidateCatalogCacheForVariants(["", null, "variant-9", undefined]);

    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ["variant-9"] } },
      select: { product: { select: { slug: true } } },
    });
    expect(deletedKeys()).toContain(CacheKeys.productSlug("tee"));
  });
});
