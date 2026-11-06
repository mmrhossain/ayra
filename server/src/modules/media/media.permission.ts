import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.ts";
import { UPLOAD_TYPE_ROLES } from "./media.constants.ts";
import {
  ADMIN_IMAGE_TYPE_PERMISSIONS,
  hasAdminPermission,
} from "../../common/utils/admin-permissions.ts";
import type { AuthRole, ImageType } from "./media.types.ts";
import {
  listMediaQuerySchema,
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

  if (role === "ADMIN") {
    const required = ADMIN_IMAGE_TYPE_PERMISSIONS[type];
    if (
      required &&
      !hasAdminPermission(
        {
          role,
          adminPermissions: req.auth?.user.adminPermissions as unknown,
          adminActions: req.auth?.user.adminActions as unknown,
          isSuperAdmin: req.auth?.user.isSuperAdmin === true,
          staffStatus: (req.auth?.user.staffStatus as string | null | undefined) ?? null,
          banned: req.auth?.user.banned === true,
        },
        required,
      )
    ) {
      throw new AppError("Forbidden: insufficient admin permissions", 403);
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

export const requireListMediaPermission = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const { type } = listMediaQuerySchema.parse(req.query);
    await assertUploadRole(req, type);
    next();
  } catch (err) {
    next(err);
  }
};
