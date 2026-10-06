import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  addWishlistItemSchema,
  listWishlistQuerySchema,
} from "./validators/wishlist.validator.ts";

const TAG = "Wishlist";

registry.registerPath({
  method: "get",
  path: "/api/v1/wishlist",
  tags: [TAG],
  summary: "Get wishlist",
  security: bearerAuth,
  responses: {
    200: successResponse("Wishlist fetched"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/wishlist/items",
  tags: [TAG],
  summary: "List wishlist items",
  security: bearerAuth,
  request: { query: listWishlistQuerySchema },
  responses: {
    200: successResponse("Wishlist items fetched"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/wishlist/items/{variantId}",
  tags: [TAG],
  summary: "Check if variant is in wishlist",
  security: bearerAuth,
  request: { params: z.object({ variantId: z.string().min(1) }) },
  responses: {
    200: successResponse("Wishlist status fetched"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/wishlist/items",
  tags: [TAG],
  summary: "Add item to wishlist",
  security: bearerAuth,
  request: { body: jsonBody(addWishlistItemSchema) },
  responses: {
    201: successResponse("Item added to wishlist"),
    ...errorResponses(400, 401, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/wishlist/items/{variantId}",
  tags: [TAG],
  summary: "Remove item from wishlist",
  security: bearerAuth,
  request: { params: z.object({ variantId: z.string().min(1) }) },
  responses: {
    200: successResponse("Item removed from wishlist"),
    ...errorResponses(401, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/wishlist",
  tags: [TAG],
  summary: "Clear wishlist",
  security: bearerAuth,
  responses: {
    200: successResponse("Wishlist cleared"),
    ...errorResponses(401),
  },
});
