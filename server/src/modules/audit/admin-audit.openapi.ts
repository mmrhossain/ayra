import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  exportAdminAuditLogsQuerySchema,
  listAdminAuditLogsQuerySchema,
} from "./admin-audit.validator.ts";

const TAG = "Audit";

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/audit-log",
  tags: [TAG],
  summary: "List admin audit logs",
  security: bearerAuth,
  request: { query: listAdminAuditLogsQuerySchema },
  responses: {
    200: successResponse("Audit logs fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/audit-log/export",
  tags: [TAG],
  summary: "Export admin audit logs",
  security: bearerAuth,
  request: { query: exportAdminAuditLogsQuerySchema },
  responses: {
    200: successResponse("Audit logs exported"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/audit-log/{id}",
  tags: [TAG],
  summary: "Get an admin audit log by id",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Audit log fetched"),
    ...errorResponses(401, 403, 404),
  },
});
