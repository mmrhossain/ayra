import type { z } from "zod";
import type {
  createBrandSchema,
  updateBrandSchema,
} from "./validators/brand.validators.ts";

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
