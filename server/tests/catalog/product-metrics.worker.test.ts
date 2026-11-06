import { beforeEach, describe, expect, it, vi } from "vitest";

const orderItem = { groupBy: vi.fn() };
const productVariant = { findMany: vi.fn() };
const product = { findMany: vi.fn(), update: vi.fn() };
const $transaction = vi.fn();

vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: { orderItem, productVariant, product, $transaction },
}));

vi.mock("../../src/common/looger/logger.ts", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { recomputeProductMetrics } = await import(
  "../../src/modules/catalog/product/worker/product-metrics.worker.ts"
);

const units = (variantId: string, quantity: number) => ({
  variantId,
  _sum: { quantity },
});

describe("recomputeProductMetrics", () => {
  beforeEach(() => {
    orderItem.groupBy.mockReset();
    productVariant.findMany.mockReset();
    product.findMany.mockReset();
    product.update.mockReset();
    $transaction.mockReset();
    product.update.mockResolvedValue({});
    $transaction.mockResolvedValue([]);
  });

  it("writes salesCount30d and the recency-weighted trendingScore", async () => {
    orderItem.groupBy
      .mockResolvedValueOnce([units("v1", 5)])
      .mockResolvedValueOnce([units("v1", 2)]);
    productVariant.findMany.mockResolvedValue([{ id: "v1", productId: "p1" }]);
    product.findMany.mockResolvedValue([]);

    const updated = await recomputeProductMetrics();

    expect(updated).toBe(1);
    expect(product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { salesCount30d: 5, trendingScore: 9 },
    });
    expect($transaction).toHaveBeenCalledTimes(1);
  });

  it("resets a product whose sales aged out of the window", async () => {
    orderItem.groupBy.mockResolvedValue([]);
    product.findMany.mockResolvedValue([
      { id: "p9", salesCount30d: 3, trendingScore: 4 },
    ]);

    const updated = await recomputeProductMetrics();

    expect(updated).toBe(1);
    expect(product.update).toHaveBeenCalledWith({
      where: { id: "p9" },
      data: { salesCount30d: 0, trendingScore: 0 },
    });
    expect(productVariant.findMany).not.toHaveBeenCalled();
  });

  it("skips writes when nothing changed", async () => {
    orderItem.groupBy
      .mockResolvedValueOnce([units("v1", 5)])
      .mockResolvedValueOnce([units("v1", 2)]);
    productVariant.findMany.mockResolvedValue([{ id: "v1", productId: "p1" }]);
    product.findMany.mockResolvedValue([
      { id: "p1", salesCount30d: 5, trendingScore: 9 },
    ]);

    const updated = await recomputeProductMetrics();

    expect(updated).toBe(0);
    expect(product.update).not.toHaveBeenCalled();
    expect($transaction).not.toHaveBeenCalled();
  });

  it("sums units across the variants of one product", async () => {
    orderItem.groupBy
      .mockResolvedValueOnce([units("v1", 2), units("v2", 3)])
      .mockResolvedValueOnce([units("v2", 1)]);
    productVariant.findMany.mockResolvedValue([
      { id: "v1", productId: "p1" },
      { id: "v2", productId: "p1" },
    ]);
    product.findMany.mockResolvedValue([]);

    await recomputeProductMetrics();

    expect(product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { salesCount30d: 5, trendingScore: 7 },
    });
  });
});
