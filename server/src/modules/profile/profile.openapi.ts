import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  updateCustomerProfileSchema,
  updateNotificationPreferencesSchema,
} from "./validators/profile.validators.ts";

const TAG = "Profile";

registry.registerPath({
  method: "get",
  path: "/api/v1/customer/profile",
  tags: [TAG],
  summary: "Get or create customer profile",
  security: bearerAuth,
  responses: {
    200: successResponse("Customer profile fetched"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/customer/profile",
  tags: [TAG],
  summary: "Create or update customer profile",
  security: bearerAuth,
  request: { body: jsonBody(updateCustomerProfileSchema) },
  responses: {
    200: successResponse("Customer profile saved"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/customer/notification-preferences",
  tags: [TAG],
  summary: "Get customer notification preferences",
  security: bearerAuth,
  responses: {
    200: successResponse("Notification preferences fetched"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/customer/notification-preferences",
  tags: [TAG],
  summary: "Update customer notification preferences",
  security: bearerAuth,
  request: { body: jsonBody(updateNotificationPreferencesSchema) },
  responses: {
    200: successResponse("Notification preferences saved"),
    ...errorResponses(400, 401),
  },
});
