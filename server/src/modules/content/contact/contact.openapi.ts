import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  createContactMessageSchema,
  listContactMessagesQuerySchema,
  contactMessageIdParamSchema,
  updateContactMessageSchema,
} from "./validators/contact.validators.ts";

const TAG = "Contact";

registry.registerPath({
  method: "post",
  path: "/api/v1/contact-messages",
  tags: [TAG],
  summary: "Submit a contact message",
  request: { body: jsonBody(createContactMessageSchema) },
  responses: {
    201: successResponse("Contact message submitted"),
    ...errorResponses(400, 429),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/contact-messages",
  tags: [TAG],
  summary: "List contact messages (admin)",
  security: bearerAuth,
  request: { query: listContactMessagesQuerySchema },
  responses: {
    200: successResponse("Contact messages fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/contact-messages/{id}",
  tags: [TAG],
  summary: "Update contact message status (admin)",
  security: bearerAuth,
  request: {
    params: contactMessageIdParamSchema,
    body: jsonBody(updateContactMessageSchema),
  },
  responses: {
    200: successResponse("Contact message updated"),
    ...errorResponses(400, 401, 403, 404),
  },
});
