import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { getOrCreateCustomerProfile } from "../../../common/utils/customerProfile.ts";
import { checkoutSchema } from "../../cart/cart.validator.ts";
import {
  cancelOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from "../validators/order.validators.ts";
import {
  cancelOrder,
  getMyOrder,
  getOrder,
  listMyOrders,
  listOrders,
  updateOrderStatus,
    checkout
} from "../services/order.service.ts";

export const checkoutHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = checkoutSchema.parse(req.body);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
    const order = await checkout(customerProfile.id, input);

    successResponse(res, order, "Order created", 201);
  }
);

export const listMyOrdersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const query = listOrdersQuerySchema.parse(req.query);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await listMyOrders(customerProfile.id, query),
      "Orders fetched"
    );
  }
);

export const getMyOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await getMyOrder(
        customerProfile.id,
        requireParam(req.params.id, "id")
      ),
      "Order fetched"
    );
  }
);

export const cancelOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = cancelOrderSchema.parse(req.body);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await cancelOrder(
        customerProfile.id,
        requireParam(req.params.id, "id"),
        input.reason
      ),
      "Order cancelled"
    );
  }
);

export const adminListOrdersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listOrdersQuerySchema.parse(req.query);

    successResponse(res, await listOrders(query), "Orders fetched");
  }
);

export const adminGetOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getOrder(requireParam(req.params.id, "id")),
      "Order fetched"
    );
  }
);

export const adminUpdateOrderStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = updateOrderStatusSchema.parse(req.body);

    successResponse(
      res,
      await updateOrderStatus(
        requireParam(req.params.id, "id"),
        input,
        req.auth.user.id
      ),
      "Order status updated"
    );
  }
);
