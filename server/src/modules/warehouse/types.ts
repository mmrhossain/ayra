import type { z } from "zod";
import type {
  createWarehouseSchema,
  listWarehousesQuerySchema,
  updateWarehouseSchema,
} from "./validators/warehouse.validators.ts";

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type ListWarehousesQuery = z.infer<typeof listWarehousesQuerySchema>;
