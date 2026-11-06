import type { AuthRole } from "../types/auth.ts";

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

export const STAFF_CANNOT_SHOP_MESSAGE =
  "Staff accounts cannot shop. Sign in with a customer account.";
