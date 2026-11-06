import { describe, expect, it } from "vitest";
import {
  ADMIN_ACTIONS,
  ADMIN_IMAGE_TYPE_PERMISSIONS,
  ADMIN_PERMISSIONS,
  hasAdminAction,
  hasAdminPermission,
  isSuperAdmin,
  normalizeAdminActions,
  normalizeAdminPermissions,
  requiredAdminPermissionForPath,
} from "../../src/common/utils/admin-permissions.ts";

describe("normalizeAdminPermissions", () => {
  it("keeps only known permissions and removes duplicates", () => {
    expect(
      normalizeAdminPermissions(["catalog", "catalog", "unknown", 42, null]),
    ).toEqual(["catalog"]);
  });

  it("returns an empty list for non-array input", () => {
    expect(normalizeAdminPermissions(undefined)).toEqual([]);
    expect(normalizeAdminPermissions("catalog")).toEqual([]);
  });
});

describe("normalizeAdminActions", () => {
  it("keeps only known actions and removes duplicates", () => {
    expect(
      normalizeAdminActions(["refunds:approve", "refunds:approve", "nope", 1]),
    ).toEqual(["refunds:approve"]);
  });
});

describe("admin permission checks", () => {
  it("does not treat empty permissions as full access", () => {
    const user = { role: "admin", adminPermissions: [] };
    expect(isSuperAdmin(user)).toBe(false);
    expect(hasAdminPermission(user, "settings")).toBe(false);
  });

  it("treats an explicit super admin as full access", () => {
    const user = { role: "admin", adminPermissions: [], isSuperAdmin: true };
    expect(isSuperAdmin(user)).toBe(true);
    expect(hasAdminPermission(user, "settings")).toBe(true);
    expect(hasAdminAction(user, "refunds:approve")).toBe(true);
  });

  it("limits scoped admins to their permissions", () => {
    const user = { role: "ADMIN", adminPermissions: ["catalog", "orders"] };
    expect(isSuperAdmin(user)).toBe(false);
    expect(hasAdminPermission(user, "catalog")).toBe(true);
    expect(hasAdminPermission(user, "settings")).toBe(false);
  });

  it("requires an explicit action for sensitive operations", () => {
    const ordersOnly = { role: "ADMIN", adminPermissions: ["orders"] };
    expect(hasAdminAction(ordersOnly, "refunds:read")).toBe(true);
    expect(hasAdminAction(ordersOnly, "refunds:create")).toBe(false);
    expect(hasAdminAction(ordersOnly, "refunds:approve")).toBe(false);

    const settingsOnly = { role: "ADMIN", adminPermissions: ["settings"] };
    expect(hasAdminAction(settingsOnly, "settings:write")).toBe(true);
    expect(hasAdminAction(settingsOnly, "settings:secrets")).toBe(false);

    const inventoryOnly = { role: "ADMIN", adminPermissions: ["inventory"] };
    expect(hasAdminAction(inventoryOnly, "inventory:adjust")).toBe(true);
    expect(hasAdminAction(inventoryOnly, "inventory:approve")).toBe(false);
  });

  it("honours explicitly granted actions", () => {
    const user = {
      role: "ADMIN",
      adminPermissions: ["orders"],
      adminActions: ["refunds:approve" as const],
    };
    expect(hasAdminAction(user, "refunds:approve")).toBe(true);
  });

  it("never grants admin permissions to non-admin roles", () => {
    expect(
      hasAdminPermission(
        { role: "CUSTOMER", adminPermissions: ADMIN_PERMISSIONS },
        "catalog",
      ),
    ).toBe(false);
    expect(
      hasAdminAction(
        { role: "CUSTOMER", adminPermissions: ADMIN_PERMISSIONS },
        "customers:read",
      ),
    ).toBe(false);
  });

  it("revokes access for suspended, offboarded and banned staff", () => {
    const base = {
      role: "ADMIN",
      adminPermissions: ADMIN_PERMISSIONS,
      adminActions: ADMIN_ACTIONS,
      isSuperAdmin: true,
    };
    expect(hasAdminPermission({ ...base, staffStatus: "SUSPENDED" }, "catalog")).toBe(false);
    expect(hasAdminPermission({ ...base, staffStatus: "OFFBOARDED" }, "catalog")).toBe(false);
    expect(hasAdminPermission({ ...base, banned: true }, "catalog")).toBe(false);
  });
});

describe("requiredAdminPermissionForPath", () => {
  it("maps admin resources to their permission", () => {
    expect(requiredAdminPermissionForPath("/api/v1/admin/products")).toBe(
      "catalog",
    );
    expect(requiredAdminPermissionForPath("/api/v1/admin/variants/1")).toBe(
      "catalog",
    );
    expect(requiredAdminPermissionForPath("/api/v1/admin/warehouses")).toBe(
      "inventory",
    );
    expect(requiredAdminPermissionForPath("/api/v1/admin/return-requests")).toBe(
      "orders",
    );
    expect(requiredAdminPermissionForPath("/api/v1/admin/payments?page=2")).toBe(
      "orders",
    );
    expect(requiredAdminPermissionForPath("/api/v1/admin/audit-log")).toBe(
      "audit",
    );
    expect(
      requiredAdminPermissionForPath("/api/v1/admin/faq-categories"),
    ).toBe("content");
    expect(
      requiredAdminPermissionForPath("/api/v1/admin/blog-categories"),
    ).toBe("content");
    expect(requiredAdminPermissionForPath("/api/v1/admin/refunds")).toBe(
      "orders",
    );
    expect(requiredAdminPermissionForPath("/api/v1/admin/shipments")).toBe(
      "orders",
    );
    expect(requiredAdminPermissionForPath("/api/v1/admin/staff/1")).toBe(
      "staff",
    );
  });

  it("requires a super admin for unknown admin paths", () => {
    expect(requiredAdminPermissionForPath("/api/v1/admin/unknown")).toBeNull();
    expect(requiredAdminPermissionForPath("/api/v1/admin")).toBeNull();
  });
});

describe("ADMIN_IMAGE_TYPE_PERMISSIONS", () => {
  it("maps every upload type to a known permission", () => {
    for (const permission of Object.values(ADMIN_IMAGE_TYPE_PERMISSIONS)) {
      expect(ADMIN_PERMISSIONS).toContain(permission);
    }
  });
});
