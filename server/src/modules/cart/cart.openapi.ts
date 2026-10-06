import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  addItemSchema,
  applyCouponSchema,
  checkoutSchema,
  guestCartSchema,
  mergeGuestCartSchema,
  saveGuestCartSchema,
  updateItemSchema,
} from "./cart.validator.ts";

const TAG = "Cart";

registry.registerPath({
  method: "get",
  path: "/api/v1/cart",
  tags: [TAG],
  summary: "Get authenticated cart",
  security: bearerAuth,
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
  security: bearerAuth,
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
  security: bearerAuth,
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
  security: bearerAuth,
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
  security: bearerAuth,
  responses: {
    200: successResponse("Cart cleared"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/cart/guest/merge",
  tags: [TAG],
  summary: "Merge guest cart into authenticated cart",
  security: bearerAuth,
  request: { body: jsonBody(mergeGuestCartSchema) },
  responses: {
    200: successResponse("Guest cart merged"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/cart/coupon",
  tags: [TAG],
  summary: "Apply coupon to cart",
  security: bearerAuth,
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
  security: bearerAuth,
  responses: {
    200: successResponse("Coupon removed"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/cart/checkout",
  tags: [TAG],
  summary: "Checkout authenticated cart",
  security: bearerAuth,
  request: { body: jsonBody(checkoutSchema) },
  responses: {
    201: successResponse("Order created"),
    ...errorResponses(400, 401, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/cart/guest",
  tags: [TAG],
  summary: "Get guest cart by sessionId",
  request: {
    query: z.object({ sessionId: z.string().min(1).max(255) }),
  },
  responses: {
    200: successResponse("Guest cart fetched"),
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/cart/guest",
  tags: [TAG],
  summary: "Save guest cart",
  request: { body: jsonBody(saveGuestCartSchema) },
  responses: {
    200: successResponse("Guest cart saved"),
    ...errorResponses(400),
  },
});
