import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  createFaqCategorySchema,
  createFaqItemSchema,
  faqIdParamSchema,
  listFaqItemsQuerySchema,
  updateFaqCategorySchema,
  updateFaqItemSchema,
} from "./validators/faq.validators.ts";

const TAG = "FAQ";

registry.registerPath({
  method: "get",
  path: "/api/v1/faqs",
  tags: [TAG],
  summary: "List published FAQs grouped by active category",
  responses: {
    200: successResponse("FAQs fetched"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/faq-categories",
  tags: [TAG],
  summary: "List FAQ categories (admin)",
  security: bearerAuth,
  responses: {
    200: successResponse("FAQ categories fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/faq-categories",
  tags: [TAG],
  summary: "Create FAQ category (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createFaqCategorySchema) },
  responses: {
    201: successResponse("FAQ category created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/faq-categories/{id}",
  tags: [TAG],
  summary: "Update FAQ category (admin)",
  security: bearerAuth,
  request: {
    params: faqIdParamSchema,
    body: jsonBody(updateFaqCategorySchema),
  },
  responses: {
    200: successResponse("FAQ category updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/faq-categories/{id}",
  tags: [TAG],
  summary: "Delete FAQ category (admin)",
  security: bearerAuth,
  request: { params: faqIdParamSchema },
  responses: {
    200: successResponse("FAQ category deleted"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/faq-items",
  tags: [TAG],
  summary: "List FAQ items (admin)",
  security: bearerAuth,
  request: { query: listFaqItemsQuerySchema },
  responses: {
    200: successResponse("FAQ items fetched"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/faq-items",
  tags: [TAG],
  summary: "Create FAQ item (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createFaqItemSchema) },
  responses: {
    201: successResponse("FAQ item created"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/faq-items/{id}",
  tags: [TAG],
  summary: "Update FAQ item (admin)",
  security: bearerAuth,
  request: {
    params: faqIdParamSchema,
    body: jsonBody(updateFaqItemSchema),
  },
  responses: {
    200: successResponse("FAQ item updated"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/faq-items/{id}",
  tags: [TAG],
  summary: "Delete FAQ item (admin)",
  security: bearerAuth,
  request: { params: faqIdParamSchema },
  responses: {
    200: successResponse("FAQ item deleted"),
    ...errorResponses(400, 401, 403, 404),
  },
});
