import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  createWarehouseSchema,
  listWarehousesQuerySchema,
  updateWarehouseSchema,
} from "./validators/warehouse.validators.ts";

const TAG = "Warehouses";

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/warehouses",
  tags: [TAG],
  summary: "List warehouses (admin)",
  security: bearerAuth,
  request: { query: listWarehousesQuerySchema },
  responses: {
    200: successResponse("Warehouses fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/warehouses",
  tags: [TAG],
  summary: "Create warehouse (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createWarehouseSchema) },
  responses: {
    201: successResponse("Warehouse created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/warehouses/{id}",
  tags: [TAG],
  summary: "Get warehouse by id (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Warehouse fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/warehouses/{id}",
  tags: [TAG],
  summary: "Update warehouse (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateWarehouseSchema),
  },
  responses: {
    200: successResponse("Warehouse updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/warehouses/{id}",
  tags: [TAG],
  summary: "Delete warehouse (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Warehouse deleted"),
    ...errorResponses(401, 403, 404),
  },
});
