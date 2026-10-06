import type { NextFunction, Request, Response } from "express";
import type { IncomingHttpHeaders } from "node:http";
import { auth } from "../../lib/auth.ts";
import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type { AuthRole } from "../types/auth.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

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

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
      headers: toHeaders(req.headers),
    });

    if (!session) {
      throw new AppError("Unauthorized: authentication required", 401);
    }

    if (session.user.banned === true) {
      const banExpires = session.user.banExpires
        ? new Date(session.user.banExpires as Date)
        : null;
      if (!banExpires || banExpires.getTime() > Date.now()) {
        throw new AppError("Account suspended", 403);
      }
    }

    req.auth = session;
    next();
  },
);

export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
      headers: toHeaders(req.headers),
    });
    req.auth = session;
    next();
  },
);

export const requireRole =
  (...roles: AuthRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const role = req.auth?.user.role;

    if (!role || !roles.includes(role as AuthRole)) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }

    next();
  };

export const requireApprovedVendor = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const role = req.auth?.user.role as AuthRole | undefined;
    const userId = req.auth?.user.id;

    if (role === "ADMIN") {
      next();
      return;
    }

    if (role !== "VENDOR" || !userId) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId },
      select: { isApproved: true },
    });

    if (!profile?.isApproved) {
      throw new AppError("Forbidden: vendor is not approved", 403);
    }

    next();
  },
);
