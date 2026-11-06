import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  createShipmentSchema,
  listShipmentsQuerySchema,
  updateShipmentStatusSchema,
} from "./shipments.validator.ts";

const TAG = "Shipments";
const idParam = z.object({ id: z.string().min(1) });

registry.registerPath({
  method: "get",
  path: "/api/v1/shipments/track/{shipmentNumber}",
  tags: [TAG],
  summary: "Track a shipment by shipment number (public)",
  security: [],
  request: {
    params: z.object({ shipmentNumber: z.string().trim().min(3).max(100) }),
  },
  responses: {
    200: successResponse("Shipment tracked"),
    ...errorResponses(400, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipments",
  tags: [TAG],
  summary: "List shipments (admin)",
  security: bearerAuth,
  request: { query: listShipmentsQuerySchema },
  responses: {
    200: successResponse("Shipments fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipments/order-context/{reference}",
  tags: [TAG],
  summary: "Get shipment order context by order id or number (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ reference: z.string().trim().min(1).max(100) }),
  },
  responses: {
    200: successResponse("Order context fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/shipments/{id}",
  tags: [TAG],
  summary: "Get shipment by id (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Shipment fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/shipments",
  tags: [TAG],
  summary: "Create shipment (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createShipmentSchema) },
  responses: {
    201: successResponse("Shipment created"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/shipments/{id}/status",
  tags: [TAG],
  summary: "Update shipment status (admin)",
  security: bearerAuth,
  request: {
    params: idParam,
    body: jsonBody(updateShipmentStatusSchema),
  },
  responses: {
    200: successResponse("Shipment status updated"),
    ...errorResponses(400, 401, 403, 404),
  },
});
