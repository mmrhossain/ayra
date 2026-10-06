import { z } from "zod";
import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  createBrandSchema,
  updateBrandSchema,
} from "./validators/brand.validators.ts";

const TAG = "Brands";

registry.registerPath({
  method: "get",
  path: "/api/v1/brands",
  tags: [TAG],
  summary: "List brands",
  responses: {
    200: successResponse("Brands fetched"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/brands",
  tags: [TAG],
  summary: "Create brand (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createBrandSchema) },
  responses: {
    201: successResponse("Brand created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/brands/{id}",
  tags: [TAG],
  summary: "Update brand (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateBrandSchema),
  },
  responses: {
    200: successResponse("Brand updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/brands/{id}",
  tags: [TAG],
  summary: "Delete brand (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Brand deleted"),
    ...errorResponses(401, 403, 404),
  },
});
