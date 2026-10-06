import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from "./coupon.validator.ts";

const TAG = "Coupons";

registry.registerPath({
  method: "get",
  path: "/api/v1/coupons/validate",
  tags: [TAG],
  summary: "Validate a coupon code",
  security: bearerAuth,
  request: {
    query: validateCouponSchema.extend({
      subtotal: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: successResponse("Coupon is valid"),
    ...errorResponses(400, 401, 404, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/coupons",
  tags: [TAG],
  summary: "List coupons (admin)",
  security: bearerAuth,
  request: { query: listCouponsQuerySchema },
  responses: {
    200: successResponse("Coupons fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/coupons",
  tags: [TAG],
  summary: "Create coupon (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createCouponSchema) },
  responses: {
    201: successResponse("Coupon created"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/coupons/{id}",
  tags: [TAG],
  summary: "Update coupon (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateCouponSchema),
  },
  responses: {
    200: successResponse("Coupon updated"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/coupons/{id}",
  tags: [TAG],
  summary: "Delete coupon (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Coupon deleted"),
    ...errorResponses(401, 403, 404),
  },
});
