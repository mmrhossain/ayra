import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { sessionAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  addItemSchema,
  applyCouponSchema,
  mergeGuestCartSchema,
  updateItemSchema,
} from "./cart.validator.ts";

const TAG = "Cart";

registry.registerPath({
  method: "post",
  path: "/api/v1/cart/guest/quote",
  tags: [TAG],
  summary: "Estimate guest cart totals",
  description: "Uses current prices and tax for active variants. Unavailable variants are omitted.",
  request: { body: { ...jsonBody(mergeGuestCartSchema), required: true } },
  responses: {
    200: successResponse("Cart estimated", z.object({
      items: z.array(z.object({
        variantId: z.string(),
        quantity: z.number().int(),
        unitPrice: z.number(),
        subtotal: z.number(),
      })),
      subtotal: z.number(),
      discountAmount: z.number(),
      taxAmount: z.number(),
      shippingAmount: z.number(),
      grandTotal: z.number(),
      taxRates: z.array(z.number()).optional(),
    })),
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/cart",
  tags: [TAG],
  summary: "Get authenticated cart",
  security: sessionAuth,
  responses: {
    200: successResponse("Cart fetched"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/cart/items",
  tags: [TAG],
  summary: "Add item to cart",
  security: sessionAuth,
  request: { body: jsonBody(addItemSchema) },
  responses: {
    200: successResponse("Item added to cart"),
    ...errorResponses(400, 401, 404),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/cart/items/{variantId}",
  tags: [TAG],
  summary: "Update cart item quantity",
  security: sessionAuth,
  request: {
    params: z.object({ variantId: z.string().min(1) }),
    body: jsonBody(updateItemSchema),
  },
  responses: {
    200: successResponse("Cart item updated"),
    ...errorResponses(400, 401, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/cart/items/{variantId}",
  tags: [TAG],
  summary: "Remove cart item",
  security: sessionAuth,
  request: { params: z.object({ variantId: z.string().min(1) }) },
  responses: {
    200: successResponse("Item removed from cart"),
    ...errorResponses(401, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/cart",
  tags: [TAG],
  summary: "Clear cart",
  security: sessionAuth,
  responses: {
    200: successResponse("Cart cleared"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/cart/guest/merge",
  tags: [TAG],
  summary: "Merge local guest cart items into authenticated cart",
  security: sessionAuth,
  request: { body: jsonBody(mergeGuestCartSchema) },
  responses: {
    200: successResponse("Guest cart merged"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/cart/coupons",
  tags: [TAG],
  summary: "List available coupons for the customer's cart",
  security: sessionAuth,
  responses: {
    200: successResponse("Available coupons fetched", z.array(z.object({
      code: z.string(),
      name: z.string(),
      discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
      discountAmount: z.number(),
    }))),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/cart/coupon",
  tags: [TAG],
  summary: "Apply coupon to cart",
  security: sessionAuth,
  request: { body: jsonBody(applyCouponSchema) },
  responses: {
    200: successResponse("Coupon applied"),
    ...errorResponses(400, 401, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/cart/coupon",
  tags: [TAG],
  summary: "Remove coupon from cart",
  security: sessionAuth,
  responses: {
    200: successResponse("Coupon removed"),
    ...errorResponses(401),
  },
});


