import type { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import { AppError } from "../../common/errors/AppError.ts";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  listCouponsQuerySchema,
} from "./coupon.validator.ts";
import {
  validateCouponCode,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "./coupon.service.ts";
import { getOrCreateCustomerProfile } from "../../common/utils/customerProfile.ts";
import { prisma } from "../../lib/prisma.ts";
import { getActiveCart } from "../cart/cart.service.ts";

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth) throw new AppError("Unauthorized", 401);

  const input = validateCouponSchema.parse({ code: req.query.code ?? req.body.code });

  const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
  const cart = await getActiveCart(customerProfile.id);
  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  const productIds = cart.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, categoryId: true },
  });
  const categoryByProduct = new Map(products.map((p) => [p.id, p.categoryId]));
  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  const result = await validateCouponCode(input.code, customerProfile.id, {
    subtotal,
    productIds,
    productCategoryIds: products.map((p) => p.categoryId),
    lines: cart.items.map((item) => ({
      productId: item.productId,
      categoryId: categoryByProduct.get(item.productId) ?? "",
      subtotal: Number(item.subtotal),
    })),
  });

  successResponse(
    res,
    { code: result.coupon.code, discountAmount: result.discountAmount },
    "Coupon is valid"
  );
});

export const adminListCoupons = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listCouponsQuerySchema.parse(req.query);
    successResponse(res, await listCoupons(query), "Coupons fetched");
  }
);

export const adminCreateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createCouponSchema.parse(req.body);
    successResponse(res, await createCoupon(input), "Coupon created", 201);
  }
);

export const adminUpdateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateCouponSchema.parse(req.body);
    successResponse(
      res,
      await updateCoupon(requireParam(req.params.id, "id"), input),
      "Coupon updated"
    );
  }
);

export const adminDeleteCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteCoupon(requireParam(req.params.id, "id")),
      "Coupon deleted"
    );
  }
);
