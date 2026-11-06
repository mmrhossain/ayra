import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import {
  errorResponses,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";

const TAG = "Geography";

const geoEntitySchema = registry.register(
  "GeoEntity",
  z.object({
    code: z.string(),
    name: z.string(),
    bnName: z.string().nullable(),
    slug: z.string().nullable(),
    aliases: z.array(z.string()),
    divisionCode: z.string().nullable(),
    districtCode: z.string().nullable(),
    upazilaCode: z.string().nullable(),
  })
);

const divisionQuery = z.object({});
const districtQuery = z.object({ divisionCode: z.string() });
const upazilaQuery = z.object({ districtCode: z.string() });
const unionQuery = z.object({
  upazilaCode: z.string(),
  districtCode: z.string().optional(),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/geo/divisions",
  tags: [TAG],
  summary: "List divisions",
  request: { query: divisionQuery },
  responses: {
    200: successResponse("Divisions fetched", z.array(geoEntitySchema)),
    ...errorResponses(502),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/geo/districts",
  tags: [TAG],
  summary: "List districts in a division",
  request: { query: districtQuery },
  responses: {
    200: successResponse("Districts fetched", z.array(geoEntitySchema)),
    ...errorResponses(400, 502),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/geo/upazilas",
  tags: [TAG],
  summary: "List upazilas (thanas) in a district",
  request: { query: upazilaQuery },
  responses: {
    200: successResponse("Upazilas fetched", z.array(geoEntitySchema)),
    ...errorResponses(400, 502),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/geo/unions",
  tags: [TAG],
  summary: "List unions in an upazila",
  request: { query: unionQuery },
  responses: {
    200: successResponse("Unions fetched", z.array(geoEntitySchema)),
    ...errorResponses(400, 502),
  },
});
