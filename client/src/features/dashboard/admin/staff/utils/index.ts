import { DashboardApiError } from "@/lib/api/dashboard";
import {
  ADMIN_PERMISSION_LABELS,
  type AdminAction,
  type AdminPermission,
} from "@/lib/admin-permissions";
import type { StaffStatus } from "@/features/dashboard/admin/staff/types/models";

export function toStaffErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function permissionSummary(
  permissions: AdminPermission[],
  isSuperAdmin = false,
): string {
  if (isSuperAdmin) return "Full access";
  return permissions.length === 0 ? "No access" : `${permissions.length} scopes`;
}

export function permissionLabels(permissions: AdminPermission[]): string[] {
  return permissions.map((permission) => ADMIN_PERMISSION_LABELS[permission] ?? permission);
}

export const ACTION_LABELS: Record<AdminAction, string> = {
  "customers:read": "View customer data",
  "customers:manage": "Manage customer accounts",
  "refunds:read": "View refunds",
  "refunds:create": "Request refunds",
  "refunds:approve": "Approve refunds",
  "inventory:adjust": "Adjust stock",
  "inventory:approve": "Approve stock adjustments",
  "settings:read": "View settings",
  "settings:write": "Edit settings",
  "settings:secrets": "Edit integration secrets",
  "staff:read": "View staff",
  "staff:manage": "Suspend and offboard staff",
  "audit:read": "View audit log",
};

export function statusLabel(status: StaffStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "SUSPENDED":
      return "Suspended";
    case "OFFBOARDED":
      return "Offboarded";
    default:
      return status;
  }
}

export function statusVariant(
  status: StaffStatus,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "OFFBOARDED":
      return "danger";
    default:
      return "neutral";
  }
}
