import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  ordersByStatusQueryOpenApiSchema,
  overviewQueryOpenApiSchema,
  salesQueryOpenApiSchema,
  topProductsQueryOpenApiSchema,
} from "./validators/analytics.validators.ts";

const TAG = "Analytics";

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/analytics/overview",
  tags: [TAG],
  summary: "Admin dashboard overview metrics",
  security: bearerAuth,
  request: { query: overviewQueryOpenApiSchema },
  responses: {
    200: successResponse("Analytics overview"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/analytics/sales",
  tags: [TAG],
  summary: "Sales trend time-series",
  security: bearerAuth,
  request: { query: salesQueryOpenApiSchema },
  responses: {
    200: successResponse("Sales trend"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/analytics/top-products",
  tags: [TAG],
  summary: "Top products by revenue or quantity",
  security: bearerAuth,
  request: { query: topProductsQueryOpenApiSchema },
  responses: {
    200: successResponse("Top products"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/analytics/orders-by-status",
  tags: [TAG],
  summary: "Order count breakdown by status",
  security: bearerAuth,
  request: { query: ordersByStatusQueryOpenApiSchema },
  responses: {
    200: successResponse("Orders by status"),
    ...errorResponses(400, 401, 403),
  },
});
