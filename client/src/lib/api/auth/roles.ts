export type AuthRole = "ADMIN" | "CUSTOMER";

const ROLES = new Set<AuthRole>(["CUSTOMER", "ADMIN"]);

export function normalizeRole(role: string | null | undefined): AuthRole | null {
  if (!role) return null;
  const normalized = role.toUpperCase() as AuthRole;
  return ROLES.has(normalized) ? normalized : null;
}

export function isStaffRole(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === "ADMIN";
}

export function staffDashboardPath(role: string | null | undefined): string | null {
  const normalized = normalizeRole(role);
  if (normalized === "ADMIN") return "/admin";
  return null;
}

export const STAFF_SHOPPING_NOTICE = "staff-shopping";

export function staffShoppingRedirect(role: string | null | undefined): string | null {
  const dashboard = staffDashboardPath(role);
  if (!dashboard) return null;
  return `${dashboard}?notice=${STAFF_SHOPPING_NOTICE}`;
}

export const STAFF_CANNOT_SHOP_MESSAGE =
  "Staff accounts cannot shop. Sign in with a customer account.";
