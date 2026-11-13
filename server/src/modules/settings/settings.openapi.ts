import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import { paginationQuerySchema } from "../../common/validators/pagination.ts";
import { updateSettingsSchema } from "./validators/settings.validators.ts";

const TAG = "Settings";

const settingFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum([
    "string",
    "number",
    "boolean",
    "select",
    "multiselect",
    "url",
    "secret",
    "textarea",
  ]),
  help: z.string().optional(),
  options: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  readOnly: z.boolean().optional(),
  value: z.unknown().optional(),
  configured: z.boolean().optional(),
  last4: z.string().nullable().optional(),
});

const settingGroupSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  fields: z.array(settingFieldSchema),
});

const publicSettingsSchema = z.object({
  store: z.object({
    name: z.string(),
    supportEmail: z.string(),
    supportPhone: z.string(),
    address: z.string(),
    logoUrl: z.string(),
    currency: z.string(),
  }),
  payment: z.object({
    enabledMethods: z.array(z.enum(["COD", "SSLCOMMERZ"])),
  }),
  checkout: z.object({
    pricesIncludeTax: z.boolean(),
    taxRatePercent: z.number(),
    freeShippingThreshold: z.number().nullable(),
  }),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/settings/public",
  tags: [TAG],
  summary: "Public storefront settings",
  security: [],
  responses: {
    200: successResponse("Settings fetched", publicSettingsSchema),
    ...errorResponses(500),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/settings",
  tags: [TAG],
  summary: "List admin settings grouped by section",
  security: bearerAuth,
  responses: {
    200: successResponse("Settings fetched", z.array(settingGroupSchema)),
    ...errorResponses(401, 403, 500),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/settings/audit",
  tags: [TAG],
  summary: "List platform setting audit entries",
  security: bearerAuth,
  request: { query: paginationQuerySchema },
  responses: {
    200: successResponse("Settings audit fetched"),
    ...errorResponses(401, 403),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/settings/{group}",
  tags: [TAG],
  summary: "Update one settings group",
  security: bearerAuth,
  request: {
    params: z.object({ group: z.string().min(1) }),
    body: jsonBody(updateSettingsSchema),
  },
  responses: {
    200: successResponse("Settings updated", settingGroupSchema),
    ...errorResponses(400, 401, 403, 404),
  },
});
