import type { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import { AppError } from "../../common/errors/AppError.ts";
import {
  vendorApplySchema,
  approveUserSchema,
  adminListUsersQuerySchema,
  banUserSchema,
} from "./auth.validator.ts";
import {
  applyAsVendor,
  listUsers,
  getUser,
  approveUser,
  banUser,
  unbanUser,
} from "./auth.service.ts";
import { toHeaders } from "../../common/middleware/auth.middleware.ts";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError("Unauthorized", 401);
  }

  successResponse(res, req.auth.user, "Current user fetched");
});

export const vendorApply = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError("Unauthorized", 401);
  }

  const input = vendorApplySchema.parse(req.body);
  const vendorProfile = await applyAsVendor(req.auth.user.id, input);

  successResponse(res, vendorProfile, "Vendor application submitted", 201);
});

export const adminListUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const query = adminListUsersQuerySchema.parse(req.query);
    const result = await listUsers(query, toHeaders(req.headers));

    successResponse(res, result, "Users fetched");
  }
);

export const adminGetUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const user = await getUser(id, toHeaders(req.headers));

    successResponse(res, user, "User fetched");
  }
);

export const adminApproveUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const input = approveUserSchema.parse(req.body);
    const user = await approveUser(id, input.isApproved);

    successResponse(res, user, "User approval status updated");
  }
);

export const adminBanUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const input = banUserSchema.parse(req.body ?? {});
    const result = await banUser(id, input, toHeaders(req.headers));

    successResponse(res, result.user, "User banned");
  }
);

export const adminUnbanUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const result = await unbanUser(id, toHeaders(req.headers));

    successResponse(res, result.user, "User unbanned");
  }
);
