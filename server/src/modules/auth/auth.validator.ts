import { z } from "zod";
import { paginationQuerySchema } from "../../common/validators/pagination.ts";
import { slugSchema } from "../../common/validators/slug.ts";
import {
  optionalCloudinaryImageUrlSchema,
  optionalMediaPublicIdSchema,
} from "../media/media.validators.ts";

export const vendorApplySchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  shopSlug: slugSchema,
  description: z.string().optional(),
  logo: optionalCloudinaryImageUrlSchema,
  logoPublicId: optionalMediaPublicIdSchema,
});

export const approveUserSchema = z.object({
  isApproved: z.boolean().default(true),
});

export const banUserSchema = z.object({
  banReason: z.string().max(500).optional(),
  banExpiresIn: z.coerce.number().int().positive().optional(),
});

export const adminListUsersQuerySchema = paginationQuerySchema.extend({
  searchValue: z.string().optional(),
  searchField: z.enum(["email", "name"]).optional(),
  searchOperator: z.enum(["contains", "starts_with", "ends_with"]).optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  filterField: z.string().optional(),
  filterValue: z.union([z.string(), z.coerce.number(), z.coerce.boolean()]).optional(),
  filterOperator: z
    .enum(["eq", "ne", "lt", "lte", "gt", "gte", "contains"])
    .optional(),
  role: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
});
