import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  adminListReviewsQuerySchema,
  createReviewSchema,
  listReviewsQuerySchema,
  rejectReviewSchema,
  updateReviewSchema,
} from "./validators/review.validators.ts";

const TAG = "Reviews";

registry.registerPath({
  method: "get",
  path: "/api/v1/products/{productId}/reviews",
  tags: [TAG],
  summary: "List product reviews",
  request: {
    params: z.object({ productId: z.string().min(1) }),
    query: listReviewsQuerySchema,
  },
  responses: {
    200: successResponse("Reviews fetched"),
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/products/{productId}/reviews",
  tags: [TAG],
  summary: "Create product review",
  security: bearerAuth,
  request: {
    params: z.object({ productId: z.string().min(1) }),
    body: jsonBody(createReviewSchema),
  },
  responses: {
    201: successResponse("Review submitted for approval"),
    ...errorResponses(400, 401, 404, 429),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/reviews/{id}",
  tags: [TAG],
  summary: "Update own review",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateReviewSchema),
  },
  responses: {
    200: successResponse("Review updated"),
    ...errorResponses(400, 401, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/reviews/{id}",
  tags: [TAG],
  summary: "Delete review (owner or admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Review deleted"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/reviews",
  tags: [TAG],
  summary: "List reviews (admin)",
  security: bearerAuth,
  request: { query: adminListReviewsQuerySchema },
  responses: {
    200: successResponse("Reviews fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/reviews/{id}/approve",
  tags: [TAG],
  summary: "Approve review (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Review approved"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/reviews/{id}/reject",
  tags: [TAG],
  summary: "Reject review (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(rejectReviewSchema),
  },
  responses: {
    200: successResponse("Review rejected"),
    ...errorResponses(400, 401, 403, 404),
  },
});
