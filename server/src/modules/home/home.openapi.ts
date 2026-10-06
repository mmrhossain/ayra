import { registry } from "../../lib/openapi/registry.ts";
import { errorResponses, successResponse } from "../../lib/openapi/common-schemas.ts";

const TAG = "Home";

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
