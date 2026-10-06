import { z } from "zod";
import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  createLegalDocumentSchema,
  legalTypeParamSchema,
  listLegalQuerySchema,
  updateLegalDocumentSchema,
} from "./validators/legal.validators.ts";

const TAG = "Legal";

registry.registerPath({
  method: "get",
  path: "/api/v1/legal/{type}",
  tags: [TAG],
  summary: "Get published privacy or terms document",
  request: { params: legalTypeParamSchema },
  responses: {
    200: successResponse("Legal document fetched"),
    ...errorResponses(400, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/legal",
  tags: [TAG],
  summary: "List legal documents (admin)",
  security: bearerAuth,
  request: { query: listLegalQuerySchema },
  responses: {
    200: successResponse("Legal documents fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/legal",
  tags: [TAG],
  summary: "Create legal document draft (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createLegalDocumentSchema) },
  responses: {
    201: successResponse("Legal document created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/legal/{id}",
  tags: [TAG],
  summary: "Update legal document draft (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateLegalDocumentSchema),
  },
  responses: {
    200: successResponse("Legal document updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/legal/{id}/publish",
  tags: [TAG],
  summary: "Publish legal document (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Legal document published"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});
