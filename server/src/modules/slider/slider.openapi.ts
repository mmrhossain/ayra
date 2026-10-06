import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  jsonBody,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import {
  createSliderSchema,
  listSlidersQuerySchema,
  sliderIdParamSchema,
  updateSliderSchema,
} from "./validators/slider.validators.ts";

const TAG = "Sliders";

registry.registerPath({
  method: "get",
  path: "/api/v1/sliders",
  tags: [TAG],
  summary: "List active sliders",
  description:
    "Returns active sliders that have an imageUrl. Desktop clients use imageUrl; mobile clients use mobileImageUrl and fall back to imageUrl when mobile is missing.",
  responses: {
    200: successResponse("Sliders fetched"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/sliders/active",
  tags: [TAG],
  summary: "List active sliders (alias)",
  responses: {
    200: successResponse("Sliders fetched"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/sliders",
  tags: [TAG],
  summary: "List sliders (admin)",
  security: bearerAuth,
  request: { query: listSlidersQuerySchema },
  responses: {
    200: successResponse("Sliders fetched"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/sliders/{id}",
  tags: [TAG],
  summary: "Get slider (admin)",
  security: bearerAuth,
  request: { params: sliderIdParamSchema },
  responses: {
    200: successResponse("Slider fetched"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/sliders",
  tags: [TAG],
  summary: "Create slider (admin)",
  description:
    "Create a slider from a previously uploaded Cloudinary image. Upload once via POST /api/v1/media/upload?type=slider. The response variants array is [desktop 1920x720, mobile 1080x1350]; use variants[0] as imageUrl and variants[1] as mobileImageUrl.",
  security: bearerAuth,
  request: { body: jsonBody(createSliderSchema) },
  responses: {
    201: successResponse("Slider created"),
    ...errorResponses(400, 401, 403),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/admin/sliders/{id}",
  tags: [TAG],
  summary: "Update slider (admin)",
  security: bearerAuth,
  request: {
    params: sliderIdParamSchema,
    body: jsonBody(updateSliderSchema),
  },
  responses: {
    200: successResponse("Slider updated"),
    ...errorResponses(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/admin/sliders/{id}",
  tags: [TAG],
  summary: "Delete slider (admin)",
  security: bearerAuth,
  request: { params: sliderIdParamSchema },
  responses: {
    200: successResponse("Slider deleted"),
    ...errorResponses(401, 403, 404),
  },
});
