import { describe, expect, it } from "vitest";

import {
  canAccessAdminPath,
  findAdminNavItemByPath,
  getAdminNavItems,
  getFirstPermittedAdminHref,
  getVisibleAdminNavGroups,
  isAdminNavItemActive,
  resolveAdminRedirect,
} from "./admin-navigation";

const SUPER_ADMIN = { role: "ADMIN", isSuperAdmin: true, adminPermissions: [] };

const scoped = (permissions: string[]) => ({
  role: "ADMIN",
  isSuperAdmin: false,
  adminPermissions: permissions,
});

function groupLabels(
  access: Parameters<typeof getVisibleAdminNavGroups>[0],
): string[] {
  return getVisibleAdminNavGroups(access).map(
    (group) => group.label ?? "Top level",
  );
}

function itemAt(href: string) {
  const item = getAdminNavItems().find((entry) => entry.href === href);
  if (!item) throw new Error(`Missing nav item ${href}`);
  return item;
}

describe("admin navigation configuration", () => {
  it("shows every group and item to a full-access admin", () => {
    expect(groupLabels(SUPER_ADMIN)).toEqual([
      "Top level",
      "Sales",
      "Catalog",
      "Growth",
      "Site",
      "System",
    ]);

    expect(getAdminNavItems().map((item) => item.label)).toEqual([
      "Overview",
      "Orders",
      "Payments",
      "Returns",
      "Refunds",
      "Shipments",
      "Shipping settings",
      "Products",
      "Categories",
      "Brands",
      "Attributes",
      "Inventory",
      "Warehouses",
      "Users",
      "Coupons",
      "Reviews",
      "Sliders",
      "Blogs",
      "FAQs",
      "Legal",
      "Staff",
      "Audit log",
      "Settings",
    ]);
    expect(getFirstPermittedAdminHref(SUPER_ADMIN)).toBe("/admin");
  });

  it("limits catalog-only staff to the catalog group", () => {
    const groups = getVisibleAdminNavGroups(scoped(["catalog"]));

    expect(groupLabels(scoped(["catalog"]))).toEqual(["Catalog"]);
    expect(groups[0]?.items.map((item) => item.href)).toEqual([
      "/admin/products",
      "/admin/categories",
      "/admin/brands",
      "/admin/attributes",
    ]);
    expect(groups.every((group) => group.items.length > 0)).toBe(true);
    expect(getFirstPermittedAdminHref(scoped(["catalog"]))).toBe(
      "/admin/products",
    );
  });

  it("limits orders-only staff to the sales group", () => {
    const groups = getVisibleAdminNavGroups(scoped(["orders"]));

    expect(groupLabels(scoped(["orders"]))).toEqual(["Sales"]);
    expect(groups[0]?.items.map((item) => item.label)).toEqual([
      "Orders",
      "Payments",
      "Returns",
      "Refunds",
      "Shipments",
    ]);
    expect(getFirstPermittedAdminHref(scoped(["orders"]))).toBe(
      "/admin/orders",
    );
  });

  it("puts inventory-only staff in the catalog group", () => {
    const groups = getVisibleAdminNavGroups(scoped(["inventory"]));

    expect(groupLabels(scoped(["inventory"]))).toEqual(["Catalog"]);
    expect(groups[0]?.items.map((item) => item.label)).toEqual([
      "Inventory",
      "Warehouses",
    ]);
    expect(getFirstPermittedAdminHref(scoped(["inventory"]))).toBe(
      "/admin/inventory",
    );
  });

  it("limits analytics-only staff to the overview", () => {
    const groups = getVisibleAdminNavGroups(scoped(["analytics"]));

    expect(groupLabels(scoped(["analytics"]))).toEqual(["Top level"]);
    expect(groups[0]?.items.map((item) => item.href)).toEqual(["/admin"]);
    expect(getFirstPermittedAdminHref(scoped(["analytics"]))).toBe("/admin");
  });

  it("drops groups without visible items", () => {
    const groups = getVisibleAdminNavGroups(scoped(["shipping"]));

    expect(groupLabels(scoped(["shipping"]))).toEqual(["Sales"]);
    expect(groups[0]?.items.map((item) => item.label)).toEqual([
      "Shipping settings",
    ]);
    expect(groups.some((group) => group.items.length === 0)).toBe(false);
  });

  it("does not treat empty permissions as full access", () => {
    expect(getVisibleAdminNavGroups(scoped(["unknown-scope"]))).toHaveLength(0);
    expect(canAccessAdminPath(scoped([]), "/admin/staff")).toBe(false);
    expect(canAccessAdminPath(SUPER_ADMIN, "/admin/staff")).toBe(true);
  });
});

describe("admin navigation active states", () => {
  it("uses exact matching for overview", () => {
    const overview = itemAt("/admin");

    expect(isAdminNavItemActive(overview, "/admin")).toBe(true);
    expect(isAdminNavItemActive(overview, "/admin/orders")).toBe(false);
  });

  it("keeps parent items active on detail, create, and edit routes", () => {
    const products = itemAt("/admin/products");
    const orders = itemAt("/admin/orders");

    expect(isAdminNavItemActive(products, "/admin/products/new")).toBe(true);
    expect(isAdminNavItemActive(products, "/admin/products/42/edit")).toBe(
      true,
    );
    expect(isAdminNavItemActive(orders, "/admin/orders/42")).toBe(true);
  });

  it("does not activate unrelated routes with similar names", () => {
    const products = itemAt("/admin/products");
    const shipping = itemAt("/admin/shipping");

    expect(isAdminNavItemActive(products, "/admin/products-archive")).toBe(
      false,
    );
    expect(isAdminNavItemActive(shipping, "/admin/shipping-settings")).toBe(
      false,
    );
    expect(findAdminNavItemByPath("/admin/products-archive")).toBeUndefined();
    expect(findAdminNavItemByPath("/admin/shipping-settings")).toBeUndefined();
  });
});

describe("admin landing redirects", () => {
  it("sends staff without analytics to their first permitted page", () => {
    expect(resolveAdminRedirect(scoped(["catalog"]), "/admin")).toBe(
      "/admin/products",
    );
    expect(resolveAdminRedirect(scoped(["orders"]), "/admin")).toBe(
      "/admin/orders",
    );
    expect(resolveAdminRedirect(scoped(["content"]), "/admin")).toBe(
      "/admin/sliders",
    );
  });

  it("keeps authorized pages in place", () => {
    expect(resolveAdminRedirect(SUPER_ADMIN, "/admin")).toBeNull();
    expect(resolveAdminRedirect(scoped(["analytics"]), "/admin")).toBeNull();
    expect(
      resolveAdminRedirect(scoped(["catalog"]), "/admin/products"),
    ).toBeNull();
    expect(
      resolveAdminRedirect(scoped(["catalog"]), "/admin/products/new"),
    ).toBeNull();
    expect(
      resolveAdminRedirect(scoped(["orders"]), "/admin/orders/42"),
    ).toBeNull();
  });

  it("redirects unauthorized deep links without looping", () => {
    const destination = resolveAdminRedirect(
      scoped(["orders"]),
      "/admin/products/new",
    );

    expect(destination).toBe("/admin/orders");
    expect(
      resolveAdminRedirect(scoped(["orders"]), destination as string),
    ).toBeNull();
  });

  it("never redirects a permitted landing page back to itself", () => {
    for (const access of [
      SUPER_ADMIN,
      scoped(["analytics"]),
      scoped(["catalog"]),
      scoped(["orders"]),
      scoped(["shipping"]),
      scoped(["content"]),
    ]) {
      const destination = resolveAdminRedirect(access, "/admin");

      if (destination) {
        expect(resolveAdminRedirect(access, destination)).toBeNull();
      }
    }
  });
});
