import type { z } from "zod";
import type {
  adminListUsersQuerySchema,
  banUserSchema,
} from "./auth.validator.ts";

export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
