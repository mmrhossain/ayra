import { z } from "zod";
import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  createAttributeSchema,
  createAttributeValueSchema,
  updateAttributeSchema,
  updateAttributeValueSchema,
} from "./validators/attribute.validators.ts";

const TAG = "Attributes";

registry.registerPath({
  method: "get",
  path: "/api/v1/attributes",
  tags: [TAG],
  summary: "List attributes with values",
  responses: {
    200: successResponse("Attributes fetched"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/attributes/{id}",
  tags: [TAG],
  summary: "Get attribute by id",
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Attribute fetched"),
    ...errorResponses(404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/attributes",
  tags: [TAG],
  summary: "Create attribute (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createAttributeSchema) },
  responses: {
    201: successResponse("Attribute created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/attributes/{id}",
  tags: [TAG],
  summary: "Update attribute (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateAttributeSchema),
  },
  responses: {
    200: successResponse("Attribute updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/attributes/{id}",
  tags: [TAG],
  summary: "Delete attribute (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Attribute deleted"),
    ...errorResponses(401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/attributes/{attributeId}/values",
  tags: [TAG],
  summary: "Create attribute value (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ attributeId: z.string().min(1) }),
    body: jsonBody(createAttributeValueSchema),
  },
  responses: {
    201: successResponse("Attribute value created"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/attribute-values/{id}",
  tags: [TAG],
  summary: "Update attribute value (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateAttributeValueSchema),
  },
  responses: {
    200: successResponse("Attribute value updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/attribute-values/{id}",
  tags: [TAG],
  summary: "Delete attribute value (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Attribute value deleted"),
    ...errorResponses(401, 403, 404, 409),
  },
});
