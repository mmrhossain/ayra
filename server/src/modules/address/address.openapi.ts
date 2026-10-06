import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  createAddressSchema,
  updateAddressSchema,
} from "./validators/address.validators.ts";

const TAG = "Addresses";
const idParam = z.object({ id: z.string().min(1) });

registry.registerPath({
  method: "post",
  path: "/api/v1/addresses",
  tags: [TAG],
  summary: "Create address",
  security: bearerAuth,
  request: { body: jsonBody(createAddressSchema) },
  responses: {
    201: successResponse("Address created"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/addresses",
  tags: [TAG],
  summary: "List my addresses",
  security: bearerAuth,
  responses: {
    200: successResponse("Addresses fetched"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/addresses/{id}",
  tags: [TAG],
  summary: "Get address by id",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Address fetched"),
    ...errorResponses(401, 404),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/addresses/{id}",
  tags: [TAG],
  summary: "Update address",
  security: bearerAuth,
  request: { params: idParam, body: jsonBody(updateAddressSchema) },
  responses: {
    200: successResponse("Address updated"),
    ...errorResponses(400, 401, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/addresses/{id}",
  tags: [TAG],
  summary: "Delete address",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Address deleted"),
    ...errorResponses(401, 404),
  },
});
