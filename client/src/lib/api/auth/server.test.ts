import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { requireAdminPageAccess, requireCustomer, redirectStaffFromStorefront } from "./server";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ name: "ayra.session_token", value: "test" }) }),
  headers: async () => new Headers({ "x-ayra-auth-return-path": "/customer/orders?status=PAID" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (destination: string) => { throw new Error(destination); },
  unstable_rethrow: () => {},
}));

const fetchSession = vi.fn();
beforeEach(() => {
  fetchSession.mockReset();
  vi.stubGlobal("fetch", fetchSession);
});
afterEach(() => vi.unstubAllGlobals());

function session(user: Record<string, unknown> | null) {
  fetchSession.mockResolvedValue(new Response(JSON.stringify({ user })));
}

it("returns expired customer requests to login with their original query", async () => {
  session(null);
  await expect(requireCustomer()).rejects.toThrow("/login?redirect=%2Fcustomer%2Forders%3Fstatus%3DPAID");
});

it("sends an authenticated unknown role to the unauthorized page", async () => {
  session({ id: "unknown", role: "unsupported" });
  await expect(requireCustomer()).rejects.toThrow("/unauthorized");
});

it("allows customer data and denies dashboard access to a customer", async () => {
  session({ id: "customer", role: "CUSTOMER" });
  await expect(requireCustomer()).resolves.toMatchObject({ user: { id: "customer" } });
  session({ id: "customer", role: "CUSTOMER" });
  await expect(requireAdminPageAccess("/admin/orders")).rejects.toThrow("/unauthorized");
});

it("redirects staff from the storefront and sends scoped admins to their permitted section", async () => {
  session({ id: "staff", role: "ADMIN", adminPermissions: ["catalog"] });
  await expect(redirectStaffFromStorefront()).rejects.toThrow("/admin");
  session({ id: "staff", role: "ADMIN", adminPermissions: ["catalog"] });
  await expect(requireAdminPageAccess("/admin/orders")).rejects.toThrow("/admin/products");
});
