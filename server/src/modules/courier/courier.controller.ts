import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.ts";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { successResponse } from "../../common/utils/response.ts";
import type { CourierProvider } from "../../generated/prisma/enums.ts";
import {
  bookShipmentCourier,
  handleCourierWebhook,
} from "./courier.service.ts";

const WEBHOOK_PROVIDERS = new Set<CourierProvider>(["PATHAO", "STEADFAST"]);

export const bookCourierHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    successResponse(
      res,
      await bookShipmentCourier(String(req.params.id), req.auth.user.id),
      "Courier booked",
    );
  },
);

export const courierWebhookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const provider = String(req.params.provider ?? "").toUpperCase() as CourierProvider;
    if (!WEBHOOK_PROVIDERS.has(provider)) {
      throw new AppError("Unsupported courier provider", 404);
    }

    const signature =
      req.header("x-pathao-signature") ??
      req.header("x-steadfast-signature") ??
      req.header("x-courier-signature") ??
      undefined;

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    const result = await handleCourierWebhook({
      provider,
      payload: req.body,
      rawBody,
      signature,
      sharedSecret: req.header("x-webhook-secret") ?? undefined,
    });

    successResponse(res, result, "Courier webhook received");
  },
);
