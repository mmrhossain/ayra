import { z } from "zod";
import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  createCategorySchema,
  listAdminCategoriesQuerySchema,
  updateCategorySchema,
} from "./validators/category.validators.ts";

const TAG = "Categories";

registry.registerPath({
  method: "get",
  path: "/api/v1/categories",
  tags: [TAG],
  summary: "List categories",
  responses: {
    200: successResponse("Categories fetched"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/categories/{slug}",
  tags: [TAG],
  summary: "Get category by slug",
  request: { params: z.object({ slug: z.string().min(1) }) },
  responses: {
    200: successResponse("Category fetched"),
    ...errorResponses(404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/categories",
  tags: [TAG],
  summary: "List categories (admin)",
  security: bearerAuth,
  request: { query: listAdminCategoriesQuerySchema },
  responses: {
    200: successResponse("Admin categories fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/categories",
  tags: [TAG],
  summary: "Create category (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createCategorySchema) },
  responses: {
    201: successResponse("Category created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/categories/{id}",
  tags: [TAG],
  summary: "Update category (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateCategorySchema),
  },
  responses: {
    200: successResponse("Category updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/categories/{id}",
  tags: [TAG],
  summary: "Delete category (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Category deleted"),
    ...errorResponses(401, 403, 404),
  },
});
