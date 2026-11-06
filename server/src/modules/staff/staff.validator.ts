import { z } from "zod";
import {
  ADMIN_ACTIONS,
  ADMIN_PERMISSIONS,
} from "../../common/utils/admin-permissions.ts";
import { paginationQuerySchema } from "../../common/validators/pagination.ts";

export const staffListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "OFFBOARDED"]).optional(),
});

export const invitationListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]).optional(),
});

export const inviteStaffSchema = z
  .object({
    email: z.string().trim().email().max(320),
    name: z.string().trim().min(1).max(200),
    permissions: z.array(z.enum(ADMIN_PERMISSIONS)).max(ADMIN_PERMISSIONS.length).default([]),
    isSuperAdmin: z.boolean().default(false),
  })
  .refine(
    (value) => !value.isSuperAdmin || value.permissions.length === 0,
    { message: "A super admin cannot also be limited to individual scopes" },
  );

export const updateStaffAccessSchema = z
  .object({
    permissions: z.array(z.enum(ADMIN_PERMISSIONS)).max(ADMIN_PERMISSIONS.length),
    actions: z.array(z.enum(ADMIN_ACTIONS)).max(ADMIN_ACTIONS.length).optional(),
    isSuperAdmin: z.boolean().optional(),
  })
  .refine(
    (value) => !value.isSuperAdmin || value.permissions.length === 0,
    { message: "A super admin cannot also be limited to individual scopes" },
  );

export const acceptInvitationSchema = z.object({
  token: z.string().min(20).max(200),
  /** Only used when no account exists for the invited email yet. */
  name: z.string().trim().min(1).max(200).optional(),
  password: z.string().min(8).max(200).optional(),
});

export const invitationTokenSchema = z.object({
  token: z.string().min(20).max(200),
});
