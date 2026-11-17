import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), create: vi.fn(), update: vi.fn(), cacheGet: vi.fn(), cacheSet: vi.fn(), cacheDel: vi.fn() }));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: { taxClass: { findMany: mocks.findMany, create: mocks.create, update: mocks.update } } }));
vi.mock("../../src/lib/cache.ts", () => ({ cacheGet: mocks.cacheGet, cacheSet: mocks.cacheSet, cacheDel: mocks.cacheDel }));
import { getTaxClasses, saveTaxClass } from "../../src/modules/tax/tax.service.ts";
const row = { id: "vat", name: "VAT", code: "VAT", rate: 15, isActive: true };
beforeEach(() => vi.resetAllMocks());
describe("tax class reference cache", () => {
  it("serves cached classes without a database query", async () => {
    mocks.cacheGet.mockResolvedValue([row]);
    expect(await getTaxClasses()).toEqual([row]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
  it("caches only normalized reference data on a miss", async () => {
    mocks.cacheGet.mockResolvedValue(null);
    mocks.findMany.mockResolvedValue([{ ...row, rate: "15.00" }]);
    expect(await getTaxClasses()).toEqual([row]);
    expect(mocks.cacheSet).toHaveBeenCalledWith("cache:tax-classes:v1", [row], 120);
  });
  it("invalidates lookup data after a successful rate update or deactivation", async () => {
    mocks.update.mockResolvedValue(row);
    await saveTaxClass({ rate: 5 }, row.id);
    expect(mocks.cacheDel).toHaveBeenCalledWith("cache:tax-classes:v1");
    await saveTaxClass({ isActive: false }, row.id);
    expect(mocks.cacheDel).toHaveBeenCalledTimes(2);
  });
  it("invalidates after creation and does not invalidate failed writes", async () => {
    mocks.create.mockResolvedValue(row);
    await saveTaxClass({ name: row.name, code: row.code, rate: row.rate, isActive: true });
    expect(mocks.cacheDel).toHaveBeenCalledTimes(1);
    mocks.update.mockRejectedValue(new Error("DB unavailable"));
    await expect(saveTaxClass({ rate: 10 }, row.id)).rejects.toThrow("DB unavailable");
    expect(mocks.cacheDel).toHaveBeenCalledTimes(1);
  });
});
