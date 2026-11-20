import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ category: { findMany: vi.fn() }, productCollection: { findMany: vi.fn() }, sliders: vi.fn(), resolve: vi.fn(), write: vi.fn() }));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: { category: mocks.category, productCollection: mocks.productCollection } }));
vi.mock("../../src/modules/slider/services/slider.service.ts", () => ({ listActiveSliders: mocks.sliders }));
vi.mock("../../src/modules/home/cache.ts", () => ({ readCachedHome: vi.fn().mockResolvedValue(null), writeCachedHome: mocks.write, invalidateHomeCache: vi.fn() }));
vi.mock("../../src/modules/catalog/collection/collection-products.service.ts", () => ({ collectionWindowWhere: () => ({}), DEFAULT_SECTIONS: [], homeCursorSchema: {}, resolveProducts: mocks.resolve, toCard: (value: unknown) => value }));
import { getHome } from "../../src/modules/home/services/home.service.ts";
beforeEach(() => { vi.resetAllMocks(); mocks.category.findMany.mockResolvedValue([]); mocks.productCollection.findMany.mockResolvedValue([{ id: "collection", name: "Featured", slug: "featured", source: "MANUAL" }]); mocks.resolve.mockResolvedValue({ products: [{ id: "product" }], nextCursor: null }); });
it("starts product sections as soon as collections are ready without waiting for the slider query", async () => {
  let finish!: (value: unknown[]) => void;
  mocks.sliders.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const request = getHome();
  try { await vi.waitFor(() => expect(mocks.resolve).toHaveBeenCalledOnce()); }
  finally { finish([]); }
  const result = await request;
  expect(result.sections[0]?.products).toEqual([{ id: "product" }]);
  expect(mocks.write).toHaveBeenCalledWith(result);
});
