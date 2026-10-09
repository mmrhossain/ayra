import { z } from "zod";
import { bdPhoneSchema } from "../../../common/validators/bangladesh.ts";
import {
  nullableCloudinaryImageUrlSchema,
  nullableMediaPublicIdSchema,
} from "../../media/media.validators.ts";

export const updateCustomerProfileSchema = z.object({
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});

export const updateVendorProfileSchema = z
  .object({
    shopName: z.string().min(1).optional(),
    description: z.string().optional(),
    logo: nullableCloudinaryImageUrlSchema,
    logoPublicId: nullableMediaPublicIdSchema,
    phone: bdPhoneSchema.optional(),
    shopSlug: z
      .string()
      .optional()
      .refine((value) => value === undefined, {
        message: "shopSlug cannot be changed",
      }),
  })
  .strict();
