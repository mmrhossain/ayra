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

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  catalog: "Catalog",
  inventory: "Inventory",
  orders: "Orders",
  customers: "Customers",
  content: "Content",
  marketing: "Marketing",
  shipping: "Shipping",
  analytics: "Analytics",
  settings: "Settings",
  audit: "Audit log",
  staff: "Staff",
};

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

/**
 * Actions that cannot be inferred from a dashboard scope; they must be granted
 * explicitly by a super admin.
 */
export const EXPLICIT_ONLY_ACTIONS: readonly AdminAction[] = [
  "refunds:create",
  "refunds:approve",
  "inventory:approve",
  "settings:secrets",
  "staff:manage",
];

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

const PERMISSION_SET = new Set<string>(ADMIN_PERMISSIONS);
const ACTION_SET = new Set<string>(ADMIN_ACTIONS);

export type AdminAccess = {
  adminPermissions?: unknown;
  adminActions?: unknown;
  isSuperAdmin?: boolean | null;
  staffStatus?: string | null;
  banned?: boolean | null;
  role?: string | null;
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
 * Mirrors the server rule: super admin is an explicit stored flag, empty
 * permission lists grant nothing, and suspended/offboarded/banned staff have
 * no access at all.
 */
export function isActiveStaff(access: AdminAccess): boolean {
  const role = typeof access.role === "string" ? access.role.toUpperCase() : "";
  if (role && role !== "ADMIN") return false;
  if (access.banned === true) return false;

  const status = typeof access.staffStatus === "string"
    ? access.staffStatus.toUpperCase()
    : "ACTIVE";
  return status === "ACTIVE";
}

export function isSuperAdmin(access: AdminAccess): boolean {
  return isActiveStaff(access) && access.isSuperAdmin === true;
}

export function hasAdminPermission(
  access: AdminAccess | unknown,
  permission: AdminPermission,
): boolean {
  // Backwards-compatible call style used by older components that pass the
  // permission array directly. Empty arrays no longer mean "full access".
  const normalized: AdminAccess = Array.isArray(access)
    ? { adminPermissions: access }
    : (access as AdminAccess);

  if (!isActiveStaff(normalized)) return false;
  if (isSuperAdmin(normalized)) return true;

  return normalizeAdminPermissions(normalized.adminPermissions).includes(
    permission,
  );
}

export function hasAdminAction(
  access: AdminAccess | unknown,
  action: AdminAction,
): boolean {
  const normalized: AdminAccess = Array.isArray(access)
    ? { adminPermissions: access }
    : (access as AdminAccess);

  if (!isActiveStaff(normalized)) return false;
  if (isSuperAdmin(normalized)) return true;

  const actions = normalizeAdminActions(normalized.adminActions);
  if (actions.includes(action)) return true;
  if (EXPLICIT_ONLY_ACTIONS.includes(action)) return false;

  const scope = ACTION_SCOPE[action];
  return scope
    ? normalizeAdminPermissions(normalized.adminPermissions).includes(scope)
    : false;
}

export function permissionSummary(
  permissions: AdminPermission[],
  isSuperAdmin = false,
): string {
  if (isSuperAdmin) return "Full access";
  return permissions.length === 0 ? "No access" : `${permissions.length} scopes`;
}
