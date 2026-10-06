import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import { chatSchema } from "./validators/ai.validators.ts";

const TAG = "AI";

registry.registerPath({
  method: "post",
  path: "/api/v1/ai/chat",
  tags: [TAG],
  summary: "Chat with store assistant (optional auth)",
  security: bearerAuth,
  request: { body: jsonBody(chatSchema) },
  responses: {
    200: successResponse("AI response"),
    ...errorResponses(400, 429),
  },
});
