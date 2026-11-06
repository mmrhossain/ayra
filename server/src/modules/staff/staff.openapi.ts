import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  acceptInvitationSchema,
  invitationListQuerySchema,
  invitationTokenSchema,
  inviteStaffSchema,
  staffListQuerySchema,
  updateStaffAccessSchema,
} from "./staff.validator.ts";

const TAG = "Staff";
const idParam = z.object({ id: z.string().min(1) });

registry.registerPath({
  method: "post",
  path: "/api/v1/staff/invitations/lookup",
  tags: [TAG],
  summary: "Look up a staff invitation by token (public)",
  security: [],
  request: { body: jsonBody(invitationTokenSchema) },
  responses: {
    200: successResponse("Invitation looked up"),
    ...errorResponses(400, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/staff/invitations/accept",
  tags: [TAG],
  summary: "Accept a staff invitation",
  description:
    "Requires an authenticated account whose email matches the invitation, or name+password to create that account first.",
  request: { body: jsonBody(acceptInvitationSchema) },
  responses: {
    200: successResponse("Invitation accepted"),
    ...errorResponses(400, 401, 404, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/staff",
  tags: [TAG],
  summary: "List staff (admin)",
  security: bearerAuth,
  request: { query: staffListQuerySchema },
  responses: {
    200: successResponse("Staff fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/staff/invitations",
  tags: [TAG],
  summary: "List staff invitations (super admin)",
  security: bearerAuth,
  request: { query: invitationListQuerySchema },
  responses: {
    200: successResponse("Invitations fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/staff/invitations",
  tags: [TAG],
  summary: "Invite staff (super admin)",
  security: bearerAuth,
  request: { body: jsonBody(inviteStaffSchema) },
  responses: {
    201: successResponse("Invitation created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/staff/invitations/{id}/resend",
  tags: [TAG],
  summary: "Resend a staff invitation (super admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Invitation resent"),
    ...errorResponses(401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/staff/invitations/{id}/revoke",
  tags: [TAG],
  summary: "Revoke a staff invitation (super admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Invitation revoked"),
    ...errorResponses(401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/staff/{id}/access",
  tags: [TAG],
  summary: "Update staff permissions (super admin)",
  security: bearerAuth,
  request: {
    params: idParam,
    body: jsonBody(updateStaffAccessSchema),
  },
  responses: {
    200: successResponse("Staff access updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/staff/{id}/suspend",
  tags: [TAG],
  summary: "Suspend a staff member (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Staff suspended"),
    ...errorResponses(401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/staff/{id}/reactivate",
  tags: [TAG],
  summary: "Reactivate a suspended staff member (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Staff reactivated"),
    ...errorResponses(401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/staff/{id}/offboard",
  tags: [TAG],
  summary: "Offboard a staff member (admin)",
  security: bearerAuth,
  request: { params: idParam },
  responses: {
    200: successResponse("Staff offboarded"),
    ...errorResponses(401, 403, 404, 409),
  },
});
