import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import {
  getAdminSettings,
  getPublicSettings,
  listSettingsAudit,
  updateSettingsGroup,
} from "../settings.service.ts";
import {
  settingsAuditQuerySchema,
  updateSettingsSchema,
} from "../validators/settings.validators.ts";

export const getPublicSettingsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await getPublicSettings(), "Settings fetched");
  },
);

export const getAdminSettingsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await getAdminSettings(), "Settings fetched");
  },
);

export const updateSettingsGroupHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = updateSettingsSchema.parse(req.body);
    const group = requireParam(req.params.group, "group");

    successResponse(
      res,
      await updateSettingsGroup(group, input.values, req.auth.user.id),
      "Settings updated",
    );
  },
);

export const listSettingsAuditHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = settingsAuditQuerySchema.parse(req.query);
    successResponse(res, await listSettingsAudit(query), "Settings audit fetched");
  },
);
