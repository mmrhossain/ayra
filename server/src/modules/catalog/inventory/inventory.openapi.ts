import { z } from "zod";
import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  approveInventoryAdjustmentSchema,
  createInventoryAdjustmentSchema,
  createInventoryTransferSchema,
  listInventoryQuerySchema,
} from "./validators/inventory.validators.ts";

const TAG = "Inventory";

const pageLimitQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/inventory",
  tags: [TAG],
  summary: "List inventory (admin)",
  security: bearerAuth,
  request: { query: listInventoryQuerySchema },
  responses: {
    200: successResponse("Inventory fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/inventory/adjustments",
  tags: [TAG],
  summary: "List inventory adjustments (admin)",
  security: bearerAuth,
  request: { query: pageLimitQuery },
  responses: {
    200: successResponse("Adjustments fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/inventory/adjustments",
  tags: [TAG],
  summary: "Create inventory adjustment (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createInventoryAdjustmentSchema) },
  responses: {
    201: successResponse("Inventory adjustment created"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/inventory/adjustments/{id}/approve",
  tags: [TAG],
  summary: "Approve or reject inventory adjustment (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(approveInventoryAdjustmentSchema),
  },
  responses: {
    200: successResponse("Inventory adjustment processed"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/inventory/transfers",
  tags: [TAG],
  summary: "List inventory transfers (admin)",
  security: bearerAuth,
  request: { query: pageLimitQuery },
  responses: {
    200: successResponse("Transfers fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/inventory/transfers",
  tags: [TAG],
  summary: "Create inventory transfer (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createInventoryTransferSchema) },
  responses: {
    201: successResponse("Inventory transfer created"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/inventory/transfers/{id}/complete",
  tags: [TAG],
  summary: "Complete inventory transfer (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Inventory transfer completed"),
    ...errorResponses(401, 403, 404),
  },
});
