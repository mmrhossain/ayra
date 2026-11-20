import { z } from "zod";
import { registry } from "../../../lib/openapi/registry.ts";
import { sessionAuth } from "../../../lib/openapi/security.ts";
import { errorResponses, jsonBody, successResponse } from "../../../lib/openapi/common-schemas.ts";
import { collectionCursorSchema, createCollectionSchema, listCollectionsSchema, updateCollectionSchema } from "./collection.validators.ts";
const id = z.object({
  id: z.string().min(1)
});
registry.registerPath({
  method: "get",
  path: "/api/v1/collections/{slug}/products",
  tags: ["Collections"],
  summary: "Browse an active collection with cursor pagination",
  request: {
    params: z.object({
      slug: z.string().min(1)
    }),
    query: collectionCursorSchema
  },
  responses: {
    200: successResponse("Collection products fetched"),
    ...errorResponses(400, 404)
  }
});
registry.registerPath({
  method: "get",
  path: "/api/v1/admin/collections",
  tags: ["Collections"],
  summary: "List collections",
  security: sessionAuth,
  request: {
    query: listCollectionsSchema
  },
  responses: {
    200: successResponse("Collections fetched"),
    ...errorResponses(401, 403)
  }
});
registry.registerPath({
  method: "get",
  path: "/api/v1/admin/collections/{id}",
  tags: ["Collections"],
  summary: "Get collection with ordered product membership",
  security: sessionAuth,
  request: {
    params: id
  },
  responses: {
    200: successResponse("Collection fetched"),
    ...errorResponses(401, 403, 404)
  }
});
registry.registerPath({
  method: "post",
  path: "/api/v1/admin/collections",
  tags: ["Collections"],
  summary: "Create collection",
  security: sessionAuth,
  request: {
    body: jsonBody(createCollectionSchema)
  },
  responses: {
    201: successResponse("Collection created"),
    ...errorResponses(400, 401, 403, 409)
  }
});
registry.registerPath({
  method: "put",
  path: "/api/v1/admin/collections/{id}",
  tags: ["Collections"],
  summary: "Update collection and optionally replace ordered membership",
  security: sessionAuth,
  request: {
    params: id,
    body: jsonBody(updateCollectionSchema)
  },
  responses: {
    200: successResponse("Collection updated"),
    ...errorResponses(400, 401, 403, 404, 409)
  }
});
registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/collections/{id}",
  tags: ["Collections"],
  summary: "Deactivate a collection without deleting products",
  security: sessionAuth,
  request: {
    params: id
  },
  responses: {
    200: successResponse("Collection deactivated"),
    ...errorResponses(401, 403, 404)
  }
});
