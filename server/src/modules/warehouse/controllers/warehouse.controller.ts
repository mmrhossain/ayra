import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import {
  createWarehouseSchema,
  listWarehousesQuerySchema,
  updateWarehouseSchema,
} from "../validators/warehouse.validators.ts";
import {
  listWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../services/warehouse.service.ts";

export const getWarehouses = asyncHandler(async (req: Request, res: Response) => {
  const query = listWarehousesQuerySchema.parse(req.query);
  successResponse(res, await listWarehouses(query), "Warehouses fetched");
});

export const getWarehouse = asyncHandler(async (req: Request, res: Response) => {
  successResponse(
    res,
    await getWarehouseById(requireParam(req.params.id, "id")),
    "Warehouse fetched"
  );
});

export const createWarehouseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createWarehouseSchema.parse(req.body);
    successResponse(res, await createWarehouse(input), "Warehouse created", 201);
  }
);

export const updateWarehouseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateWarehouseSchema.parse(req.body);
    successResponse(
      res,
      await updateWarehouse(requireParam(req.params.id, "id"), input),
      "Warehouse updated"
    );
  }
);

export const deleteWarehouseHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteWarehouse(requireParam(req.params.id, "id")),
      "Warehouse deleted"
    );
  }
);
