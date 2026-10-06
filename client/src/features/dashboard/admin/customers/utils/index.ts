import { DashboardApiError } from "@/lib/api/dashboard";
import type { AdminUserItem, UserRole, UserStatus } from "../types";
import { USER_ROLES, USER_STATUSES } from "../types";

export function parseUserRole(value: unknown): UserRole | undefined {
  if (typeof value !== "string") return undefined;
  return USER_ROLES.includes(value as UserRole)
    ? (value as UserRole)
    : undefined;
}

export function parseUserStatus(value: unknown): UserStatus | undefined {
  if (typeof value !== "string") return undefined;
  return USER_STATUSES.includes(value as UserStatus)
    ? (value as UserStatus)
    : undefined;
}

export function isUserBanned(
  user: Pick<AdminUserItem, "banned" | "status">,
): boolean {
  if (user.banned === true) return true;
  return user.status === "BLOCKED";
}

export function toUserErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
