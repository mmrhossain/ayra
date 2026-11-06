import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";

const TAG = "Couriers";

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/shipments/{id}/courier",
  tags: [TAG],
  summary: "Book a courier for a shipment (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Courier booked"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/webhooks/couriers/{provider}",
  tags: [TAG],
  summary: "Courier status webhook (HMAC or shared-secret, no bearer auth)",
  description:
    "provider is PATHAO or STEADFAST (case-insensitive). Sign the raw JSON body with HMAC-SHA256 in X-PATHAO-SIGNATURE / X-STEADFAST-SIGNATURE, or send the shared secret in X-WEBHOOK-SECRET.",
  security: [],
  request: {
    params: z.object({
      provider: z.enum(["PATHAO", "STEADFAST", "pathao", "steadfast"]),
    }),
  },
  responses: {
    200: successResponse("Courier webhook received"),
    ...errorResponses(400, 401, 404),
  },
});
