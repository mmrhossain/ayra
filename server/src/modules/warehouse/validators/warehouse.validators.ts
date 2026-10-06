import { z } from "zod";
import { paginationQuerySchema } from "../../../common/validators/pagination.ts";

export const createWarehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  country: z.string().min(1),
  state: z.string().min(1).optional(),
  city: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().min(1).optional(),
  isActive: z.boolean().default(true),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const listWarehousesQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  isActive: z.coerce.boolean().optional(),
});
