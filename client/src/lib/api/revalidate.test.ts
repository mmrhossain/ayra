import { beforeEach, expect, it, vi } from "vitest";
import { revalidateStorefrontTags } from "./revalidate";

const mocks = vi.hoisted(() => ({ get: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("@/lib/api/dashboard", () => ({
  dashboardApi: { get: mocks.get },
  DashboardApiError: class extends Error {
    constructor(readonly status: number) { super(); }
  },
}));

beforeEach(() => vi.resetAllMocks());

it("authorizes the whole tag batch using the current catalog scope", async () => {
  mocks.get.mockResolvedValue({ data: { role: "ADMIN", adminPermissions: ["catalog"] } });
  await revalidateStorefrontTags(["home", "products", "product:summer-dress", "home"]);
  expect(mocks.revalidateTag.mock.calls).toEqual([
    ["home", "max"], ["products", "max"], ["product:summer-dress", "max"],
  ]);
  mocks.revalidateTag.mockClear();
  await revalidateStorefrontTags(["products", "blogs"]);
  await revalidateStorefrontTags(["product:invalid/path"]);
  expect(mocks.revalidateTag).not.toHaveBeenCalled();
});

it.each([
  { role: "CUSTOMER", adminPermissions: ["catalog"] },
  { role: "ADMIN", adminPermissions: ["orders"] },
  { role: "ADMIN", adminPermissions: ["catalog"], staffStatus: "SUSPENDED" },
])("denies cache changes for %j", async (data) => {
  mocks.get.mockResolvedValue({ data });
  await revalidateStorefrontTags(["products"]);
  expect(mocks.revalidateTag).not.toHaveBeenCalled();
});

it("allows content save tags and preserves explicit super-admin access", async () => {
  mocks.get.mockResolvedValueOnce({ data: { role: "ADMIN", adminPermissions: ["content"] } });
  await revalidateStorefrontTags(["home", "sliders"]);
  mocks.get.mockResolvedValueOnce({ data: { role: "ADMIN", isSuperAdmin: true } });
  await revalidateStorefrontTags(["collections"]);
  expect(mocks.revalidateTag.mock.calls).toEqual([
    ["home", "max"], ["sliders", "max"], ["collections", "max"],
  ]);
});
