import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { sessionAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import { checkoutSchema } from "../cart/cart.validator.ts";
import {
  cancelOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from "./validators/order.validators.ts";
import {
  createReturnRequestSchema,
  listReturnRequestsQuerySchema,
  reviewReturnRequestSchema,
} from "./validators/return.validators.ts";

const TAG = "Orders";

registry.registerPath({
  method: "post",
  path: "/api/v1/checkout",
  tags: [TAG],
  summary: "Create order from cart",
  description: "Send the same Idempotency-Key and payload when retrying checkout to replay the original response.",
  security: sessionAuth,
  request: {
    headers: z.object({ "Idempotency-Key": z.string().min(1).optional() }),
    body: { ...jsonBody(checkoutSchema), required: true },
  },
  responses: {
    201: successResponse("Order created"),
    ...errorResponses(400, 401, 403, 404, 409, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/orders",
  tags: [TAG],
  summary: "List my orders",
  security: sessionAuth,
  request: { query: listOrdersQuerySchema },
  responses: {
    200: successResponse("Orders fetched"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/orders/{id}",
  tags: [TAG],
  summary: "Get my order",
  security: sessionAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Order fetched"),
    ...errorResponses(401, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/orders/{id}/cancel",
  tags: [TAG],
  summary: "Cancel my order",
  security: sessionAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(cancelOrderSchema),
  },
  responses: {
    200: successResponse("Order cancelled"),
    ...errorResponses(400, 401, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/orders/{id}/return-request",
  tags: [TAG],
  summary: "Create a return request for a delivered order",
  security: sessionAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(createReturnRequestSchema),
  },
  responses: {
    201: successResponse("Return request created"),
    ...errorResponses(400, 401, 404, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/orders",
  tags: [TAG],
  summary: "List all orders (admin)",
  security: sessionAuth,
  request: { query: listOrdersQuerySchema },
  responses: {
    200: successResponse("Orders fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/orders/{id}",
  tags: [TAG],
  summary: "Get order by id (admin)",
  security: sessionAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Order fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/orders/{id}/status",
  tags: [TAG],
  summary: "Update order status (admin)",
  security: sessionAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateOrderStatusSchema),
  },
  responses: {
    200: successResponse("Order status updated"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/return-requests",
  tags: [TAG],
  summary: "List return requests (admin)",
  security: sessionAuth,
  request: { query: listReturnRequestsQuerySchema },
  responses: {
    200: successResponse("Return requests fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/return-requests/{id}",
  tags: [TAG],
  summary: "Approve or reject a return request (admin)",
  security: sessionAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(reviewReturnRequestSchema),
  },
  responses: {
    200: successResponse("Return request updated"),
    ...errorResponses(400, 401, 403, 404),
  },
});
