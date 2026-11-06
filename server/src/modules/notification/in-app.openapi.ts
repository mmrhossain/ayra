import { z } from "zod";
import { paginationQuerySchema } from "../../common/validators/pagination.ts";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";

const TAG = "Notifications";

const listQuery = paginationQuerySchema.extend({
  unreadOnly: z.enum(["true", "false"]).optional(),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/notifications",
  tags: [TAG],
  summary: "List in-app notifications",
  security: bearerAuth,
  request: { query: listQuery },
  responses: {
    200: successResponse("Notifications fetched"),
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/notifications/unread-count",
  tags: [TAG],
  summary: "Get unread in-app notification count",
  security: bearerAuth,
  responses: {
    200: successResponse("Unread count fetched"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/notifications/read-all",
  tags: [TAG],
  summary: "Mark all in-app notifications as read",
  security: bearerAuth,
  responses: {
    200: successResponse("Notifications marked read"),
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/notifications/{id}/read",
  tags: [TAG],
  summary: "Mark one in-app notification as read",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Notification marked read"),
    ...errorResponses(401, 404),
  },
});
