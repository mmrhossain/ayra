import type { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import { AppError } from "../../common/errors/AppError.ts";
import {
  adminListUsersQuerySchema,
  banUserSchema,
} from "./auth.validator.ts";
import {
  listUsers,
  getUser,
  banUser,
  unbanUser,
} from "./auth.service.ts";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new AppError("Unauthorized", 401);
  }

  successResponse(res, req.auth.user, "Current user fetched");
});

export const adminListUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const query = adminListUsersQuerySchema.parse(req.query);
    const result = await listUsers(query);

    successResponse(res, result, "Users fetched");
  },
);

export const adminGetUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const user = await getUser(id);

    successResponse(res, user, "User fetched");
  },
);

export const adminBanUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const input = banUserSchema.parse(req.body ?? {});
    const result = await banUser(id, input);

    successResponse(res, result.user, "User banned");
  },
);

export const adminUnbanUser = asyncHandler(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");
    const result = await unbanUser(id);

    successResponse(res, result.user, "User unbanned");
  },
);
