import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/api/dashboard", () => ({ dashboardApi: { get: mocks.get }, DashboardApiError: class extends Error {} }));
import { fetchAdminProduct } from "./products";
const id = "c6998a0d-6759-4b83-b4d6-9786ff3fd118";
describe("Admin edit product lookup", () => {
  beforeEach(() => { mocks.get.mockReset(); });
  it.each([id, "(.)" + id, "(.)(.)(.)(.)" + id])("loads the canonical product for route ID %s", async (routeId) => {
    const product = { id, name: "Sandals" };
    mocks.get.mockResolvedValue({ data: product });
    expect(await fetchAdminProduct(routeId)).toBe(product);
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith("/admin/products/" + id, expect.objectContaining({ cache: "no-store" }));
  });
  it("preserves a genuine not-found response without retrying", async () => {
    const error = new Error("Product not found");
    mocks.get.mockRejectedValue(error);
    const result = await fetchAdminProduct("(.)" + id).catch((cause: unknown) => cause);
    expect(result).toBe(error);
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });
});
