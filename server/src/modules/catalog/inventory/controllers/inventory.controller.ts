import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../../common/utils/requireParam.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import { AppError } from "../../../../common/errors/AppError.ts";
import {
  createInventoryAdjustmentSchema,
  approveInventoryAdjustmentSchema,
  createInventoryTransferSchema,
  listInventoryQuerySchema,
} from "../validators/inventory.validators.ts";
import {
  listInventory,
  createInventoryAdjustment,
  approveInventoryAdjustment,
  createInventoryTransfer,
  completeInventoryTransfer,
  listInventoryAdjustments,
  listInventoryTransfers,
} from "../services/inventory.service.ts";

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const query = listInventoryQuerySchema.parse(req.query);
  successResponse(res, await listInventory(query), "Inventory fetched");
});

export const createAdjustmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = createInventoryAdjustmentSchema.parse(req.body);
    successResponse(
      res,
      await createInventoryAdjustment(input, req.auth.user.id),
      "Inventory adjustment created",
      201
    );
  }
);

export const approveAdjustmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = approveInventoryAdjustmentSchema.parse(req.body);
    successResponse(
      res,
      await approveInventoryAdjustment(
        requireParam(req.params.id, "id"),
        input.approved,
        req.auth.user.id
      ),
      "Inventory adjustment processed"
    );
  }
);

export const getAdjustments = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  successResponse(res, await listInventoryAdjustments(page, limit), "Adjustments fetched");
});

export const createTransferHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = createInventoryTransferSchema.parse(req.body);
    successResponse(
      res,
      await createInventoryTransfer(input, req.auth.user.id),
      "Inventory transfer created",
      201
    );
  }
);

export const completeTransferHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    successResponse(
      res,
      await completeInventoryTransfer(
        requireParam(req.params.id, "id"),
        req.auth.user.id
      ),
      "Inventory transfer completed"
    );
  }
);

export const getTransfers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  successResponse(res, await listInventoryTransfers(page, limit), "Transfers fetched");
});
