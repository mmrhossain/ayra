import "server-only";

import { SESSION_COOKIE } from "@/config/public";
import { BACKEND_API_ORIGIN } from "@/config/server";
import { safeRedirectPath } from "@/features/auth/lib/oauth";
import {
  normalizeRole,
  staffDashboardPath,
  staffShoppingRedirect,
  type AuthRole,
} from "@/lib/api/auth/roles";
import { resolveAdminRedirect } from "@/lib/admin-navigation";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache } from "react";

export type { AuthRole } from "@/lib/api/auth/roles";

export type UserSession = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    adminPermissions?: string[];
    adminActions?: string[];
    isSuperAdmin?: boolean;
    staffStatus?: string;
    createdAt?: string;
    banned?: boolean;
  };
} | null;

export const getUserSession = cache(async (): Promise<UserSession> => {
  try {
    const cookieStore = await cookies();
    const session =
      cookieStore.get(SESSION_COOKIE) ??
      cookieStore.get(`__Secure-${SESSION_COOKIE}`);

    if (!session?.value) return null;

    const response = await fetch(`${BACKEND_API_ORIGIN}/auth/get-session`, {
      headers: {
        cookie: `${session.name}=${session.value}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.user ? data : null;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to get user session:", error);
    return null;
  }
});

const STAFF_DISABLED_STATUSES = new Set(["SUSPENDED", "OFFBOARDED"]);

function isStaffDisabled(session: UserSession): boolean {
  const role = normalizeRole(session?.user?.role);
  if (role !== "ADMIN") return false;
  const status = (session?.user?.staffStatus ?? "ACTIVE").toUpperCase();
  return STAFF_DISABLED_STATUSES.has(status);
}

export async function requireRole(
  ...roles: AuthRole[]
): Promise<NonNullable<UserSession>> {
  const session = await getUserSession();
  const role = normalizeRole(session?.user?.role);

  if (!role) {
    redirect("/login");
  }

  if (session?.user?.banned || isStaffDisabled(session)) {
    redirect("/account-suspended");
  }

  if (!roles.includes(role)) {
    redirect("/unauthorized");
  }

  return session as NonNullable<UserSession>;
}

/**
 * Converts the session user into the shared access descriptor so the sidebar,
 * page redirects and tests all evaluate the same policy. Super-admin status is
 * an explicit flag; empty permissions no longer imply full access.
 */
export const toAdminAccess = (user: NonNullable<UserSession>["user"]) => ({
  role: user?.role ?? null,
  adminPermissions: Array.isArray(user?.adminPermissions)
    ? user.adminPermissions
    : [],
  adminActions: Array.isArray(user?.adminActions) ? user.adminActions : [],
  isSuperAdmin: user?.isSuperAdmin === true,
  staffStatus: user?.staffStatus ?? "ACTIVE",
  banned: user?.banned === true,
});

export async function requireAdminPageAccess(
  pathname: string,
  redirectQuery = "",
): Promise<NonNullable<UserSession>> {
  const session = await requireRole("ADMIN");
  const destination = resolveAdminRedirect(
    toAdminAccess(session.user),
    pathname,
  );

  if (destination) {
    redirect(
      destination.startsWith("/admin")
        ? `${destination}${redirectQuery}`
        : destination,
    );
  }

  return session;
}

export async function redirectStaffFromStorefront(): Promise<UserSession> {
  const session = await getUserSession();
  const dest = staffDashboardPath(session?.user?.role);
  if (dest) redirect(dest);
  return session;
}

/**
 * Sends an already signed-in visitor away from an auth page (login/register).
 * Admins land on their dashboard; customers keep the originally intended
 * destination. Resolved server-side so admins never bounce through the
 * storefront root first.
 */
export async function redirectSignedInFromAuthPage(
  rawRedirect?: string | null,
): Promise<UserSession> {
  const session = await getUserSession();
  const role = normalizeRole(session?.user?.role);
  if (!role) return session;

  const intended = safeRedirectPath(rawRedirect);

  if (role === "ADMIN") {
    redirect(intended.startsWith("/admin") ? intended : "/admin");
  }

  redirect(intended.startsWith("/admin") ? "/" : intended);
}

export async function redirectStaffFromShopping(): Promise<UserSession> {
  const session = await getUserSession();
  const dest = staffShoppingRedirect(session?.user?.role);
  if (dest) redirect(dest);
  return session;
}

export async function requireCustomer(): Promise<NonNullable<UserSession>> {
  const session = await getUserSession();
  const role = normalizeRole(session?.user?.role);

  if (!role) {
    redirect("/login");
  }

  if (session?.user?.banned || isStaffDisabled(session)) {
    redirect("/account-suspended");
  }

  const dest = staffShoppingRedirect(role);
  if (dest) redirect(dest);

  if (role !== "CUSTOMER") {
    redirect("/unauthorized");
  }

  return session as NonNullable<UserSession>;
}
