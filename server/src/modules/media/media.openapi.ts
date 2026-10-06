import { z } from "zod";
import { registry } from "../../lib/openapi/registry.ts";
import { bearerAuth } from "../../lib/openapi/security.ts";
import {
  errorResponses,
  successResponse,
} from "../../lib/openapi/common-schemas.ts";
import { IMAGE_TYPE_VALUES } from "./media.types.ts";
import {
  multipleUploadQuerySchema,
  singleUploadQuerySchema,
} from "./media.validators.ts";

const TAG = "Media";

const multipartBody = (schema: z.ZodTypeAny) => ({
  content: {
    "multipart/form-data": { schema },
  },
});

const uploadedImageSchema = z.object({
  publicId: z.string(),
  url: z.string().url(),
  secure_url: z.string().url(),
  variants: z.array(z.string().url()).openapi({
    description:
      "On-the-fly Cloudinary delivery URLs. Slider: [desktop 1920x720, mobile 960x360]. Category: [desktop banner 1920x720, mobile banner 960x360, card 800x1067]. Product: [detail 1200x1500, thumbnail 400x500].",
  }),
});

const singleImageBodySchema = z.object({
  type: z.enum(IMAGE_TYPE_VALUES).openapi({
    description:
      "Image type. For multiple product images use POST /api/v1/media/uploads.",
  }),
  image: z.string().openapi({
    format: "binary",
    description: "Image file (jpg, jpeg, png, webp). Max 5MB.",
  }),
});

const multipleImagesBodySchema = z.object({
  type: z.literal("product").openapi({
    description: "Must be product. Max 5 files.",
  }),
  images: z
    .array(z.string())
    .min(1)
    .max(5)
    .openapi({
      description: "Product images (jpg, jpeg, png, webp). Max 5 files, 5MB each.",
    }),
});

registry.registerPath({
  method: "post",
  path: "/api/v1/media/upload",
  tags: [TAG],
  summary: "Upload a single image",
  description:
    "Streams one image from disk after magic-byte validation. Role-gated by type: product/category/slider/blog require ADMIN; customer_avatar requires CUSTOMER or ADMIN; vendor_avatar requires an approved VENDOR or ADMIN. Product bulk uploads must use /media/uploads. Delivery URLs are generated on the fly (f_auto, q_auto). Cloudinary failures return 502 or 504 with { success: false, message }.",
  security: bearerAuth,
  request: {
    query: singleUploadQuerySchema,
    body: multipartBody(singleImageBodySchema),
  },
  responses: {
    201: successResponse("Image uploaded", uploadedImageSchema),
    ...errorResponses(400, 401, 403, 429, 502, 504),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/media/uploads",
  tags: [TAG],
  summary: "Upload multiple product images",
  description:
    "Uploads 1–5 product images after magic-byte validation. ADMIN only. Other image types are rejected.",
  security: bearerAuth,
  request: {
    query: multipleUploadQuerySchema,
    body: multipartBody(multipleImagesBodySchema),
  },
  responses: {
    201: successResponse("Images uploaded", z.array(uploadedImageSchema)),
    ...errorResponses(400, 401, 403, 429, 502, 504),
  },
});
