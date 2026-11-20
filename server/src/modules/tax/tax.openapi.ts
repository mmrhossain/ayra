import { z } from "zod";
import { errorResponses, IdParamSchema, jsonBody, successResponse } from "../../lib/openapi/common-schemas.ts";
import { registry } from "../../lib/openapi/registry.ts";
import { sessionAuth } from "../../lib/openapi/security.ts";
import { createTaxClassSchema, updateTaxClassSchema } from "./tax.validator.ts";

const taxClass = registry.register("TaxClass", z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  rate: z.number().min(0).max(100),
  isActive: z.boolean(),
}));

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/tax-classes",
  tags: ["Tax"],
  summary: "List tax classes",
  description: "Requires admin catalog access.",
  security: sessionAuth,
  responses: { 200: successResponse("Tax classes fetched", z.array(taxClass)), ...errorResponses(401, 403) },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/tax-classes",
  tags: ["Tax"],
  summary: "Create a tax class",
  security: sessionAuth,
  request: { body: { ...jsonBody(createTaxClassSchema), required: true } },
  responses: { 201: successResponse("Tax class created", taxClass), ...errorResponses(400, 401, 403, 409) },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/tax-classes/{id}",
  tags: ["Tax"],
  summary: "Update a tax class",
  security: sessionAuth,
  request: { params: IdParamSchema, body: { ...jsonBody(updateTaxClassSchema), required: true } },
  responses: { 200: successResponse("Tax class updated", taxClass), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/tax-classes/{id}",
  tags: ["Tax"],
  summary: "Delete a tax class",
  description: "Reassign products that use the tax class before deleting it.",
  security: sessionAuth,
  request: { params: IdParamSchema },
  responses: { 200: successResponse("Tax class deleted", z.null()), ...errorResponses(401, 403, 404, 409) },
});
