import type { z } from "zod";
import type {
  adminListUsersQuerySchema,
  approveUserSchema,
  banUserSchema,
  vendorApplySchema,
} from "./auth.validator.ts";

export type VendorApplyInput = z.infer<typeof vendorApplySchema>;
export type ApproveUserInput = z.infer<typeof approveUserSchema>;
export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
