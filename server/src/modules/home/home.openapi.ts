import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { errorResponses, successResponse } from "../../lib/openapi/common-schemas.ts";

const TAG = "Home";

registry.registerPath({
  method: "get",
  path: "/api/v1/home/sections/{id}/products",
  tags: [TAG],
  summary: "Get the next homepage section products",
  request: {
    params: z.object({ id: z.string().min(1) }),
    query: z.object({ cursor: z.string().min(1).max(2048).optional() }),
  },
  responses: {
    200: successResponse("Homepage section products fetched"),
    ...errorResponses(400, 404),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/home",
  tags: [TAG],
  summary: "Get homepage payload",
  description:
    "Aggregated storefront homepage: active sliders, top-level categories, and ordered product sections. Automatic sections fall back when no HOME collections exist.",
  responses: {
    200: successResponse("Home fetched"),
    ...errorResponses(500),
  },
});
