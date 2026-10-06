import type { z } from "zod";
import type {
  createSliderSchema,
  listSlidersQuerySchema,
  updateSliderSchema,
} from "./validators/slider.validators.ts";

export type CreateSliderInput = z.infer<typeof createSliderSchema>;
export type UpdateSliderInput = z.infer<typeof updateSliderSchema>;
export type ListSlidersQuery = z.infer<typeof listSlidersQuerySchema>;
