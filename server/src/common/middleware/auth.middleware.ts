import type { NextFunction, Request, Response } from "express";
import type { IncomingHttpHeaders } from "node:http";
import { auth } from "../../lib/auth.ts";
import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type { AuthRole } from "../types/auth.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import {
  isStaffRole,
  normalizeRole,
  STAFF_CANNOT_SHOP_MESSAGE,
} from "../utils/roles.ts";
import {
  hasAdminAction,
  hasAdminPermission,
  isSuperAdmin,
  requiredAdminPermissionForPath,
  type AdminAction,
  type AdminPermission,
} from "../utils/admin-permissions.ts";

export const toHeaders = (headers: IncomingHttpHeaders): Headers => {
  const h = new Headers();

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      for (const v of value) h.append(key, v);
    } else {
      h.append(key, value);
    }
  }

  return h;
};

const STAFF_DISABLED_STATUSES = new Set(["SUSPENDED", "OFFBOARDED"]);

/**
 * Reads authorization-critical fields straight from the database.
 *
 * Better Auth caches the session's user snapshot in Redis for up to the
 * session lifetime, so a permission change would otherwise remain effective
 * until that cache expired. Authorization must never trust the cached snapshot
 * or the frontend. Reading these fields fresh on every authenticated request
 * makes permission reductions, role demotions and suspensions effective from
 * the very next request, even when session revocation itself failed.
 */
export const loadFreshAuthorizationUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      adminPermissions: true,
      adminActions: true,
      isSuperAdmin: true,
      staffStatus: true,
      banned: true,
      banReason: true,
      banExpires: true,
      deletedAt: true,
    },
  });

  return user;
};

const assertUserAllowed = (user: {
  banned?: boolean | null;
  banExpires?: Date | null;
  deletedAt?: Date | null;
  staffStatus?: string | null;
  role?: string | null;
}) => {
  if (user.deletedAt) {
    throw new AppError("Unauthorized: authentication required", 401);
  }

  if (user.banned === true) {
    const banExpires = user.banExpires ? new Date(user.banExpires) : null;
    if (!banExpires || banExpires.getTime() > Date.now()) {
      throw new AppError("Account suspended", 403);
    }
  }

  const status = typeof user.staffStatus === "string"
    ? user.staffStatus.toUpperCase()
    : "ACTIVE";

  if (normalizeRole(user.role) === "ADMIN" && STAFF_DISABLED_STATUSES.has(status)) {
    throw new AppError(
      status === "OFFBOARDED"
        ? "Staff access has been removed"
        : "Staff account suspended",
      403,
    );
  }
};

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
      headers: toHeaders(req.headers),
    });

    if (!session) {
      throw new AppError("Unauthorized: authentication required", 401);
    }

    const fresh = await loadFreshAuthorizationUser(session.user.id);
    if (!fresh) {
      throw new AppError("Unauthorized: authentication required", 401);
    }

    assertUserAllowed(fresh);

    req.auth = {
      ...session,
      user: {
        ...session.user,
        ...fresh,
      },
    };
    next();
  },
);

export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
      headers: toHeaders(req.headers),
    });

    if (session) {
      const fresh = await loadFreshAuthorizationUser(session.user.id);
      if (fresh && !fresh.deletedAt) {
        req.auth = {
          ...session,
          user: {
            ...session.user,
            ...fresh,
          },
        };
        next();
        return;
      }
    }

    req.auth = null;
    next();
  },
);

export const requireRole =
  (...roles: AuthRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const role = normalizeRole(req.auth?.user.role);

    if (!role || !roles.includes(role)) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }

    if (role === "ADMIN") {
      const required = requiredAdminPermissionForPath(
        req.originalUrl ?? req.path,
      );
      const user = req.auth?.user;

      if (
        required === null
          ? !isSuperAdmin(user ?? {})
          : !hasAdminPermission(user ?? {}, required)
      ) {
        throw new AppError("Forbidden: insufficient admin permissions", 403);
      }
    }

    next();
  };

export const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!isSuperAdmin(req.auth?.user ?? {})) {
    throw new AppError("Forbidden: super admin required", 403);
  }
  next();
};

/**
 * Requires an explicit action-level permission. Used for sensitive operations
 * such as refund approval, inventory approval and secret management where a
 * broad dashboard scope is not sufficient.
 */
export const requireAdminAction =
  (...actions: AdminAction[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.auth?.user;
    if (!user || !actions.some((action) => hasAdminAction(user, action))) {
      throw new AppError("Forbidden: insufficient admin permissions", 403);
    }
    next();
  };

/**
 * Requires any of the given dashboard scopes.
 */
export const requireAdminPermission =
  (...permissions: AdminPermission[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.auth?.user;
    if (
      !user ||
      !permissions.some((permission) => hasAdminPermission(user, permission))
    ) {
      throw new AppError("Forbidden: insufficient admin permissions", 403);
    }
    next();
  };

export const requireCustomer = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const role = normalizeRole(req.auth?.user.role);
  if (role !== "CUSTOMER") {
    throw new AppError(
      isStaffRole(role) ? STAFF_CANNOT_SHOP_MESSAGE : "Forbidden: insufficient permissions",
      403,
    );
  }
  next();
};
