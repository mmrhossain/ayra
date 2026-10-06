import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  blogIdParamSchema,
  blogSlugParamSchema,
  createBlogCategorySchema,
  createBlogSchema,
  listAdminBlogsQuerySchema,
  listPublicBlogsQuerySchema,
  updateBlogCategorySchema,
  updateBlogSchema,
} from "./validators/blog.validators.ts";

const TAG = "Blog";

registry.registerPath({
  method: "get",
  path: "/api/v1/blogs",
  tags: [TAG],
  summary: "List published blog posts",
  request: { query: listPublicBlogsQuerySchema },
  responses: {
    200: successResponse("Blogs fetched"),
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/blogs/{slug}",
  tags: [TAG],
  summary: "Get published blog post by slug",
  request: { params: blogSlugParamSchema },
  responses: {
    200: successResponse("Blog fetched"),
    ...errorResponses(400, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/blog-categories",
  tags: [TAG],
  summary: "List blog categories (admin)",
  security: bearerAuth,
  responses: {
    200: successResponse("Blog categories fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/blog-categories",
  tags: [TAG],
  summary: "Create blog category (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createBlogCategorySchema) },
  responses: {
    201: successResponse("Blog category created"),
    ...errorResponses(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/blog-categories/{id}",
  tags: [TAG],
  summary: "Update blog category (admin)",
  security: bearerAuth,
  request: {
    params: blogIdParamSchema,
    body: jsonBody(updateBlogCategorySchema),
  },
  responses: {
    200: successResponse("Blog category updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/blog-categories/{id}",
  tags: [TAG],
  summary: "Delete blog category (admin)",
  security: bearerAuth,
  request: { params: blogIdParamSchema },
  responses: {
    200: successResponse("Blog category deleted"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/blogs",
  tags: [TAG],
  summary: "List blog posts (admin)",
  security: bearerAuth,
  request: { query: listAdminBlogsQuerySchema },
  responses: {
    200: successResponse("Blogs fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/blogs",
  tags: [TAG],
  summary: "Create blog post draft (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createBlogSchema) },
  responses: {
    201: successResponse("Blog created"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/blogs/{id}",
  tags: [TAG],
  summary: "Update blog post (admin)",
  security: bearerAuth,
  request: {
    params: blogIdParamSchema,
    body: jsonBody(updateBlogSchema),
  },
  responses: {
    200: successResponse("Blog updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/blogs/{id}/publish",
  tags: [TAG],
  summary: "Publish blog post (admin)",
  security: bearerAuth,
  request: { params: blogIdParamSchema },
  responses: {
    200: successResponse("Blog published"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/blogs/{id}",
  tags: [TAG],
  summary: "Soft-delete blog post (admin)",
  security: bearerAuth,
  request: { params: blogIdParamSchema },
  responses: {
    200: successResponse("Blog deleted"),
    ...errorResponses(400, 401, 403, 404),
  },
});
