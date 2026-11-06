import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.ts";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import {
  createShipmentSchema,
  listShipmentsQuerySchema,
  shipmentNumberParamSchema,
  updateShipmentStatusSchema,
} from "./shipments.validator.ts";
import {
  createShipment,
  getShipmentById,
  getShipmentOrderContext,
  listShipments,
  trackShipment,
  updateShipmentStatus,
} from "./shipments.service.ts";

const actorId = (req: Request): string => {
  if (!req.auth?.user.id) throw new AppError("Unauthorized", 401);
  return req.auth.user.id;
};

export const listShipmentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listShipmentsQuerySchema.parse(req.query);
    successResponse(res, await listShipments(query), "Shipments fetched");
  },
);

export const getShipmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getShipmentById(requireParam(req.params.id, "id")),
      "Shipment fetched",
    );
  },
);

export const getShipmentOrderContextHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getShipmentOrderContext(requireParam(req.params.reference, "reference")),
      "Shipment order context fetched",
    );
  },
);

export const createShipmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createShipmentSchema.parse(req.body);
    successResponse(
      res,
      await createShipment(input, actorId(req)),
      "Shipment created",
      201,
    );
  },
);

export const updateShipmentStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateShipmentStatusSchema.parse(req.body);
    successResponse(
      res,
      await updateShipmentStatus(
        requireParam(req.params.id, "id"),
        input,
        actorId(req),
      ),
      "Shipment status updated",
    );
  },
);

export const trackShipmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const shipmentNumber = shipmentNumberParamSchema.parse(req.params.shipmentNumber);
    res.set("Cache-Control", "no-store");
    successResponse(res, await trackShipment(shipmentNumber), "Shipment fetched");
  },
);
