import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  initiatePaymentSchema,
  listPaymentsQuerySchema,
  listRefundsQuerySchema,
  refundSchema,
  refundStatusSchema,
  sslcommerzFailCancelSchema,
  sslcommerzIpnSchema,
  sslcommerzSuccessSchema,
} from "./validators/payment.validators.ts";

const TAG = "Payments";

registry.registerPath({
  method: "post",
  path: "/api/v1/payments/{orderId}/initiate",
  tags: [TAG],
  summary: "Initiate payment for an order",
  security: bearerAuth,
  request: {
    params: z.object({ orderId: z.string().min(1) }),
    body: jsonBody(initiatePaymentSchema),
  },
  responses: {
    201: successResponse("Payment initiated"),
    ...errorResponses(400, 401, 404, 429),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/payments/sslcommerz/success",
  tags: [TAG],
  summary: "SSLCommerz success callback (POST body or GET query; redirects to storefront)",
  security: [],
  request: { body: jsonBody(sslcommerzSuccessSchema) },
  responses: {
    302: { description: "Redirect to storefront payment success or failed page" },
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/payments/sslcommerz/success",
  tags: [TAG],
  summary: "SSLCommerz success callback via GET query (browser redirect)",
  security: [],
  request: { query: sslcommerzSuccessSchema },
  responses: {
    302: { description: "Redirect to storefront payment success or failed page" },
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/payments/sslcommerz/failed",
  tags: [TAG],
  summary: "SSLCommerz failed callback (POST body or GET query; redirects to storefront)",
  security: [],
  request: { body: jsonBody(sslcommerzFailCancelSchema) },
  responses: {
    302: { description: "Redirect to storefront payment failed page" },
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/payments/sslcommerz/failed",
  tags: [TAG],
  summary: "SSLCommerz failed callback via GET query (browser redirect)",
  security: [],
  request: { query: sslcommerzFailCancelSchema },
  responses: {
    302: { description: "Redirect to storefront payment failed page" },
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/payments/sslcommerz/cancelled",
  tags: [TAG],
  summary: "SSLCommerz cancelled callback (POST body or GET query; redirects to storefront)",
  security: [],
  request: { body: jsonBody(sslcommerzFailCancelSchema) },
  responses: {
    302: { description: "Redirect to storefront payment cancelled page" },
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/payments/sslcommerz/cancelled",
  tags: [TAG],
  summary: "SSLCommerz cancelled callback via GET query (browser redirect)",
  security: [],
  request: { query: sslcommerzFailCancelSchema },
  responses: {
    302: { description: "Redirect to storefront payment cancelled page" },
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/payments/sslcommerz/ipn",
  tags: [TAG],
  summary: "SSLCommerz IPN webhook (signature-based, no bearer auth)",
  security: [],
  request: { body: jsonBody(sslcommerzIpnSchema) },
  responses: {
    200: successResponse("IPN processed"),
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/payments",
  tags: [TAG],
  summary: "List payments (admin)",
  security: bearerAuth,
  request: { query: listPaymentsQuerySchema },
  responses: {
    200: successResponse("Payments fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/refunds",
  tags: [TAG],
  summary: "List refunds (admin)",
  security: bearerAuth,
  request: { query: listRefundsQuerySchema },
  responses: {
    200: successResponse("Refunds fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/refunds/{refundId}",
  tags: [TAG],
  summary: "Update refund status (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ refundId: z.string().min(1) }),
    body: jsonBody(refundStatusSchema),
  },
  responses: {
    200: successResponse("Refund updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/payments/{id}",
  tags: [TAG],
  summary: "Get payment by id including gatewayResponse (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Payment fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/payments/cod/{paymentId}/collect",
  tags: [TAG],
  summary: "Collect COD payment (admin)",
  security: bearerAuth,
  request: { params: z.object({ paymentId: z.string().min(1) }) },
  responses: {
    200: successResponse("Payment collected"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/payments/{paymentId}/refund",
  tags: [TAG],
  summary: "Refund a payment (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ paymentId: z.string().min(1) }),
    body: jsonBody(refundSchema),
  },
  responses: {
    201: successResponse("Refund created"),
    ...errorResponses(400, 401, 403, 404),
  },
});
