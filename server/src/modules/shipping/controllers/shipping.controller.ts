import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import {
  createShippingMethodSchema,
  createShippingRateSchema,
  createShippingZoneSchema,
  shippingOptionsQuerySchema,
  shippingQuoteSchema,
  updateShippingMethodSchema,
  updateShippingRateSchema,
  updateShippingZoneSchema,
} from "../validators/shipping.validators.ts";
import {
  createShippingMethod,
  createShippingRate,
  createShippingZone,
  deleteShippingRate,
  deleteShippingZone,
  getShippingMethodById,
  getShippingRateById,
  getShippingZoneById,
  listShippingMethods,
  listShippingOptions,
  listShippingRates,
  listShippingZones,
  quoteShipping,
  updateShippingMethod,
  updateShippingRate,
  updateShippingZone,
} from "../services/shipping.service.ts";

const addressFromQuote = (input: {
  shippingAddress?:
    | { district: string; division?: string | undefined }
    | undefined;
  district?: string | undefined;
}) => {
  const district = input.shippingAddress?.district ?? input.district;
  if (!district) {
    throw new AppError("Delivery district is required to calculate shipping", 400);
  }
  return {
    district,
    division: input.shippingAddress?.division,
  };
};

export const getShippingOptionsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = shippingOptionsQuerySchema.parse(req.query);
    if (!query.district) {
      throw new AppError("Delivery district is required to calculate shipping", 400);
    }
    const result = await listShippingOptions(
      { district: query.district },
      query.subtotal ?? 0
    );
    successResponse(res, result, "Shipping options fetched");
  }
);

export const quoteShippingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = shippingQuoteSchema.parse(req.body);
    const address = addressFromQuote(input);
    const quote = await quoteShipping(
      address,
      input.shippingMethodCode,
      input.subtotal ?? 0
    );
    successResponse(res, quote, "Shipping quote calculated");
  }
);

export const adminListZonesHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listShippingZones(), "Shipping zones fetched");
  }
);

export const adminGetZoneHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getShippingZoneById(requireParam(req.params.id, "id")),
      "Shipping zone fetched"
    );
  }
);

export const adminCreateZoneHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createShippingZoneSchema.parse(req.body);
    successResponse(res, await createShippingZone(input), "Shipping zone created", 201);
  }
);

export const adminUpdateZoneHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateShippingZoneSchema.parse(req.body);
    successResponse(
      res,
      await updateShippingZone(requireParam(req.params.id, "id"), input),
      "Shipping zone updated"
    );
  }
);

export const adminDeleteZoneHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteShippingZone(requireParam(req.params.id, "id")),
      "Shipping zone deleted"
    );
  }
);

export const adminListMethodsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listShippingMethods(), "Shipping methods fetched");
  }
);

export const adminGetMethodHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getShippingMethodById(requireParam(req.params.id, "id")),
      "Shipping method fetched"
    );
  }
);

export const adminCreateMethodHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createShippingMethodSchema.parse(req.body);
    successResponse(
      res,
      await createShippingMethod(input),
      "Shipping method created",
      201
    );
  }
);

export const adminUpdateMethodHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateShippingMethodSchema.parse(req.body);
    successResponse(
      res,
      await updateShippingMethod(requireParam(req.params.id, "id"), input),
      "Shipping method updated"
    );
  }
);

export const adminListRatesHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listShippingRates(), "Shipping rates fetched");
  }
);

export const adminGetRateHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getShippingRateById(requireParam(req.params.id, "id")),
      "Shipping rate fetched"
    );
  }
);

export const adminCreateRateHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createShippingRateSchema.parse(req.body);
    successResponse(res, await createShippingRate(input), "Shipping rate created", 201);
  }
);

export const adminUpdateRateHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateShippingRateSchema.parse(req.body);
    successResponse(
      res,
      await updateShippingRate(requireParam(req.params.id, "id"), input),
      "Shipping rate updated"
    );
  }
);

export const adminDeleteRateHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteShippingRate(requireParam(req.params.id, "id")),
      "Shipping rate deleted"
    );
  }
);
