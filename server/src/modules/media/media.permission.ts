import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.ts";
import { prisma } from "../../lib/prisma.ts";
import { UPLOAD_TYPE_ROLES } from "./media.constants.ts";
import type { AuthRole, ImageType } from "./media.types.ts";
import {
  multipleUploadQuerySchema,
  singleUploadQuerySchema,
} from "./media.validators.ts";

const resolveType = (req: Request, mode: "single" | "multiple"): ImageType => {
  const raw = { type: req.query.type ?? req.body?.type };
  const parsed =
    mode === "multiple"
      ? multipleUploadQuerySchema.parse(raw)
      : singleUploadQuerySchema.parse(raw);
  return parsed.type;
};

const assertUploadRole = async (req: Request, type: ImageType) => {
  const role = req.auth?.user.role as AuthRole | undefined;
  const userId = req.auth?.user.id;
  const allowed = UPLOAD_TYPE_ROLES[type];

  if (!role || !userId || !allowed.includes(role)) {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  if (type === "vendor_avatar" && role === "VENDOR") {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId },
      select: { isApproved: true },
    });
    if (!profile?.isApproved) {
      throw new AppError("Forbidden: vendor is not approved", 403);
    }
  }
};

export const requireSingleUploadPermission = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const type = resolveType(req, "single");
    await assertUploadRole(req, type);
    next();
  } catch (err) {
    next(err);
  }
};

export const requireMultipleUploadPermission = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const type = resolveType(req, "multiple");
    await assertUploadRole(req, type);
    next();
  } catch (err) {
    next(err);
  }
};
