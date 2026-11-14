import { normalizeRole } from "./roles.ts";

/**
 * Coarse dashboard scopes. A scope grants access to an area of the admin
 * dashboard. Scopes never imply full access: a staff account with no scopes
 * has no administrative access at all.
 */
export const ADMIN_PERMISSIONS = [
  "catalog",
  "inventory",
  "orders",
  "customers",
  "content",
  "marketing",
  "shipping",
  "analytics",
  "settings",
  "audit",
  "staff",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/**
 * Action-level permissions for sensitive operations that must not be granted
 * merely by holding a broad dashboard scope.
 */
export const ADMIN_ACTIONS = [
  "customers:read",
  "customers:manage",
  "refunds:read",
  "refunds:create",
  "refunds:approve",
  "inventory:adjust",
  "inventory:approve",
  "settings:read",
  "settings:write",
  "settings:secrets",
  "staff:read",
  "staff:manage",
  "audit:read",
] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

const PERMISSION_SET = new Set<string>(ADMIN_PERMISSIONS);
const ACTION_SET = new Set<string>(ADMIN_ACTIONS);

/** Scope that owns each action, used for non-sensitive action defaults. */
const ACTION_SCOPE: Record<AdminAction, AdminPermission> = {
  "customers:read": "customers",
  "customers:manage": "customers",
  "refunds:read": "orders",
  "refunds:create": "orders",
  "refunds:approve": "orders",
  "inventory:adjust": "inventory",
  "inventory:approve": "inventory",
  "settings:read": "settings",
  "settings:write": "settings",
  "settings:secrets": "settings",
  "staff:read": "staff",
  "staff:manage": "staff",
  "audit:read": "audit",
};

/**
 * Actions that can only be granted explicitly. Holding the owning scope is not
 * enough, so a catalog-only staff member cannot approve refunds or change
 * integration secrets just because they were given `orders`/`settings`.
 */
const EXPLICIT_ONLY_ACTIONS = new Set<AdminAction>([
  "refunds:create",
  "refunds:approve",
  "inventory:approve",
  "settings:secrets",
  "staff:manage",
]);

const PATH_PERMISSIONS: Record<string, AdminPermission> = {
  products: "catalog",
  variants: "catalog",
  attributes: "catalog",
  "attribute-values": "catalog",
  categories: "catalog",
  brands: "catalog",
  inventory: "inventory",
  warehouses: "inventory",
  orders: "orders",
  shipments: "orders",
  "return-requests": "orders",
  payments: "orders",
  refunds: "orders",
  coupons: "marketing",
  reviews: "marketing",
  users: "customers",
  settings: "settings",
  legal: "content",
  "contact-messages": "content",
  faqs: "content",
  "faq-categories": "content",
  "faq-items": "content",
  blogs: "content",
  "blog-categories": "content",
  sliders: "content",
  analytics: "analytics",
  shipping: "shipping",
  "audit-log": "audit",
  staff: "staff",
};

export type AdminPermissionUser = {
  role?: string | null | undefined;
  adminPermissions?: unknown;
  adminActions?: unknown;
  isSuperAdmin?: boolean | null | undefined;
  staffStatus?: string | null | undefined;
  banned?: boolean | null | undefined;
};

export function normalizeAdminPermissions(value: unknown): AdminPermission[] {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value.filter(
        (entry): entry is AdminPermission =>
          typeof entry === "string" && PERMISSION_SET.has(entry),
      ),
    ),
  ];
}

export function normalizeAdminActions(value: unknown): AdminAction[] {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value.filter(
        (entry): entry is AdminAction =>
          typeof entry === "string" && ACTION_SET.has(entry),
      ),
    ),
  ];
}

/**
 * A user can only exercise administrative access if they are an ADMIN, are not
 * banned, and have not been suspended or offboarded.
 */
export function isActiveStaff(user: AdminPermissionUser): boolean {
  if (normalizeRole(user.role) !== "ADMIN") return false;
  if (user.banned === true) return false;

  const status = typeof user.staffStatus === "string"
    ? user.staffStatus.toUpperCase()
    : "ACTIVE";

  return status === "ACTIVE";
}

/**
 * Super admin is an explicit, stored designation. Empty permissions never
 * imply full access.
 */
export function isSuperAdmin(user: AdminPermissionUser): boolean {
  return isActiveStaff(user) && user.isSuperAdmin === true;
}

export function hasAdminPermission(
  user: AdminPermissionUser,
  permission: AdminPermission,
): boolean {
  if (!isActiveStaff(user)) return false;
  if (isSuperAdmin(user)) return true;

  return normalizeAdminPermissions(user.adminPermissions).includes(permission);
}

export function hasAdminAction(
  user: AdminPermissionUser,
  action: AdminAction,
): boolean {
  if (!isActiveStaff(user)) return false;
  if (isSuperAdmin(user)) return true;

  if (normalizeAdminActions(user.adminActions).includes(action)) return true;
  if (EXPLICIT_ONLY_ACTIONS.has(action)) return false;

  const scope = ACTION_SCOPE[action];
  return scope ? normalizeAdminPermissions(user.adminPermissions).includes(scope) : false;
}

/** Only super admins may assign privileges or invite staff. */
export function canAssignPrivileges(user: AdminPermissionUser): boolean {
  return isSuperAdmin(user);
}

/** Staff operations such as suspend, offboard and session revocation. */
export function canOperateStaff(user: AdminPermissionUser): boolean {
  return hasAdminAction(user, "staff:manage");
}

export function requiredAdminPermissionForPath(
  originalUrl: string,
): AdminPermission | null {
  const [rawPath = ""] = originalUrl.split("?");
  const relative = rawPath
    .replace(/^\/api\/v1\/admin\/?/, "")
    .split("/")
    .filter(Boolean);

  const segment = relative[0];
  if (!segment) return null;

  // Unknown administrative resources fail closed: only a super admin passes.
  return PATH_PERMISSIONS[segment] ?? null;
}

export const ADMIN_IMAGE_TYPE_PERMISSIONS = {
  product: "catalog",
  category: "catalog",
  brand: "catalog",
  slider: "content",
  blog: "content",
  customer_avatar: "customers",
} as const satisfies Record<string, AdminPermission>;
