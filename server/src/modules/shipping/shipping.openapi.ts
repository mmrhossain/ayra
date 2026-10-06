import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  createShippingMethodSchema,
  createShippingRateSchema,
  createShippingZoneSchema,
  shippingOptionsQuerySchema,
  shippingQuoteSchema,
  updateShippingMethodSchema,
  updateShippingRateSchema,
  updateShippingZoneSchema,
} from "./validators/shipping.validators.ts";

const TAG = "Shipping";
const idParam = z.object({ id: z.string().min(1) });

registry.registerPath({
  method: "get",
  path: "/api/v1/shipping/options",
  tags: [TAG],
  summary: "List available shipping options for an address",
  security: bearerAuth,
  request: { query: shippingOptionsQuerySchema },
  responses: {
    200: successResponse("Shipping options fetched"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/shipping/quote",
  tags: [TAG],
  summary: "Calculate shipping for a selected method and address",
  security: bearerAuth,
  request: { body: jsonBody(shippingQuoteSchema) },
  responses: {
    200: successResponse("Shipping quote calculated"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipping/zones",
  tags: [TAG],
  summary: "List shipping zones (admin)",
  security: bearerAuth,
  responses: {
    200: successResponse("Shipping zones fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/shipping/zones",
  tags: [TAG],
  summary: "Create shipping zone (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createShippingZoneSchema) },
  responses: {
    201: successResponse("Shipping zone created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipping/zones/{id}",
  tags: [TAG],
  summary: "Get shipping zone (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Shipping zone fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/shipping/zones/{id}",
  tags: [TAG],
  summary: "Update shipping zone (admin)",
  security: bearerAuth,
  request: { params: idParam, body: jsonBody(updateShippingZoneSchema) },
  responses: {
    200: successResponse("Shipping zone updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/shipping/zones/{id}",
  tags: [TAG],
  summary: "Delete shipping zone (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Shipping zone deleted"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipping/methods",
  tags: [TAG],
  summary: "List shipping methods (admin)",
  security: bearerAuth,
  responses: {
    200: successResponse("Shipping methods fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/shipping/methods",
  tags: [TAG],
  summary: "Create shipping method (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createShippingMethodSchema) },
  responses: {
    201: successResponse("Shipping method created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipping/methods/{id}",
  tags: [TAG],
  summary: "Get shipping method (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Shipping method fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/shipping/methods/{id}",
  tags: [TAG],
  summary: "Update shipping method (admin)",
  security: bearerAuth,
  request: { params: idParam, body: jsonBody(updateShippingMethodSchema) },
  responses: {
    200: successResponse("Shipping method updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipping/rates",
  tags: [TAG],
  summary: "List shipping rates (admin)",
  security: bearerAuth,
  responses: {
    200: successResponse("Shipping rates fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/shipping/rates",
  tags: [TAG],
  summary: "Create shipping rate (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createShippingRateSchema) },
  responses: {
    201: successResponse("Shipping rate created"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipping/rates/{id}",
  tags: [TAG],
  summary: "Get shipping rate (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Shipping rate fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/shipping/rates/{id}",
  tags: [TAG],
  summary: "Update shipping rate (admin)",
  security: bearerAuth,
  request: { params: idParam, body: jsonBody(updateShippingRateSchema) },
  responses: {
    200: successResponse("Shipping rate updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/shipping/rates/{id}",
  tags: [TAG],
  summary: "Delete shipping rate (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Shipping rate deleted"),
    ...errorResponses(401, 403, 404),
  },
});
