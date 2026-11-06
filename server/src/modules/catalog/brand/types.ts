import type { z } from "zod";
import type {
  createBrandSchema,
  listAdminBrandsQuerySchema,
  updateBrandSchema,
} from "./validators/brand.validators.ts";

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type ListAdminBrandsQuery = z.infer<typeof listAdminBrandsQuerySchema>;
