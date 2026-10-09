import { z } from "zod";
import { paginationQuerySchema } from "../../../common/validators/pagination.ts";
import {
  cloudinaryImageUrlSchema,
  nullableCloudinaryImageUrlSchema,
  nullableMediaPublicIdSchema,
  optionalCloudinaryImageUrlSchema,
  optionalMediaPublicIdSchema,
} from "../../media/media.validators.ts";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().trim().url().max(2000).optional()
);

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

const booleanFromForm = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return value;
}, z.boolean().optional());

export const createSliderSchema = z.object({
  title: z.string().trim().min(1).max(200),
  imageUrl: cloudinaryImageUrlSchema,
  imagePublicId: optionalMediaPublicIdSchema,
  mobileImageUrl: optionalCloudinaryImageUrlSchema,
  mobileImagePublicId: optionalMediaPublicIdSchema,
  redirectUrl: optionalUrl,
  startDate: optionalDate,
  endDate: optionalDate,
  priority: z.coerce.number().int().min(0).max(1_000_000).default(0),
  isActive: booleanFromForm,
});

export const updateSliderSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  imageUrl: nullableCloudinaryImageUrlSchema,
  imagePublicId: nullableMediaPublicIdSchema,
  mobileImageUrl: nullableCloudinaryImageUrlSchema,
  mobileImagePublicId: nullableMediaPublicIdSchema,
  redirectUrl: optionalUrl,
  startDate: optionalDate,
  endDate: optionalDate,
  priority: z.coerce.number().int().min(0).max(1_000_000).optional(),
  isActive: booleanFromForm,
});

export const listSlidersQuerySchema = paginationQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  title: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  isActive: booleanFromForm,
});

export const sliderIdParamSchema = z.object({
  id: z.string().uuid(),
});
