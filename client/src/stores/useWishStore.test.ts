import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock("@/lib/api/dashboard", () => ({ dashboardApi: mocks, DashboardApiError: class extends Error {} }));
import { useWishStore } from "./useWishStore";
const result = (id: string) => ({ data: { items: [{ id, variantId: id }], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } } });
beforeEach(() => { vi.resetAllMocks(); useWishStore.getState().clearWish(); });
describe("wishlist request sharing", () => {
  it("twenty concurrent consumers produce one request", async () => {
    mocks.get.mockResolvedValue(result("variant"));
    await Promise.all(Array.from({ length: 20 }, () => useWishStore.getState().fetchWishList()));
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(useWishStore.getState().wishCount).toBe(1);
    await useWishStore.getState().fetchWishList();
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
  it("an older request cannot overwrite refreshed wishlist state after a mutation", async () => {
    let resolve!: (value: ReturnType<typeof result>) => void;
    mocks.get.mockReturnValueOnce(new Promise(done => { resolve = done; })).mockResolvedValue(result("new"));
    mocks.post.mockResolvedValue({ message: "Added" });
    const old = useWishStore.getState().fetchWishList();
    await useWishStore.getState().addToWish("new");
    resolve(result("old"));
    await old;
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(useWishStore.getState().wishes?.[0]?.variantId).toBe("new");
  });
  it("a pending response cannot repopulate cleared wishlist state", async () => {
    let resolve!: (value: ReturnType<typeof result>) => void;
    mocks.get.mockReturnValue(new Promise(done => { resolve = done; }));
    const pending = useWishStore.getState().fetchWishList();
    useWishStore.getState().clearWish();
    resolve(result("old-user"));
    await pending;
    expect(useWishStore.getState().wishes).toEqual([]);
  });
});
