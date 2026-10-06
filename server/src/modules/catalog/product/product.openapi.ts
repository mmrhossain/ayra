import { z } from "zod";
import { registry } from "../../../lib/openapi/registry.ts";
import { bearerAuth } from "../../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../../lib/openapi/common-schemas.ts";
import {
  createProductSchema,
  createVariantSchema,
  listProductsQuerySchema,
  updateProductSchema,
  updateVariantSchema,
} from "./validators/product.validators.ts";

const TAG = "Products";

registry.registerPath({
  method: "get",
  path: "/api/v1/products",
  tags: [TAG],
  summary: "List products",
  description:
    "Public paginated catalog of ACTIVE products. featured=true returns only featured products. onSale=true returns products with at least one variant where compareAtPrice > price. Admin/vendor may pass includeInactive=true or status=DRAFT|ACTIVE|ARCHIVED.",
  request: { query: listProductsQuerySchema },
  responses: {
    200: successResponse("Products fetched"),
    ...errorResponses(400),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/products/{slug}",
  tags: [TAG],
  summary: "Get product by slug",
  request: { params: z.object({ slug: z.string().min(1) }) },
  responses: {
    200: successResponse("Product fetched"),
    ...errorResponses(404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/products/{id}",
  tags: [TAG],
  summary: "Get product by id including draft and archived (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Product fetched"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/products",
  tags: [TAG],
  summary: "Create product (admin)",
  security: bearerAuth,
  request: { body: jsonBody(createProductSchema) },
  responses: {
    201: successResponse("Product created"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/products/{id}",
  tags: [TAG],
  summary: "Update product (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateProductSchema),
  },
  responses: {
    200: successResponse("Product updated"),
    ...errorResponses(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/products/{id}",
  tags: [TAG],
  summary: "Delete product (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Product deleted"),
    ...errorResponses(401, 403, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/products/{productId}/variants",
  tags: [TAG],
  summary: "Create product variant (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ productId: z.string().min(1) }),
    body: jsonBody(createVariantSchema),
  },
  responses: {
    201: successResponse("Variant created"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/variants/{id}",
  tags: [TAG],
  summary: "Update variant (admin)",
  security: bearerAuth,
  request: {
    params: z.object({ id: z.string().min(1) }),
    body: jsonBody(updateVariantSchema),
  },
  responses: {
    200: successResponse("Variant updated"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/variants/{id}",
  tags: [TAG],
  summary: "Delete variant (admin)",
  security: bearerAuth,
  request: { params: z.object({ id: z.string().min(1) }) },
  responses: {
    200: successResponse("Variant deleted"),
    ...errorResponses(401, 403, 404),
  },
});
