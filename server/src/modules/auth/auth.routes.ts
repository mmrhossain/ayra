import { Router } from "express";
import {
  requireAdminAction,
  requireAuth,
  requireRole,
} from "../../common/middleware/auth.middleware.ts";

import {
  adminListUsers,
  adminGetUser,
  adminBanUser,
  adminUnbanUser,
} from "./auth.controller.ts";

const router = Router();

// Customer account administration. Reading customer data requires
// `customers:read`; changing it requires `customers:manage`; promoting or
// deleting staff is owner-only and lives under `/admin/staff`.
router.get(
  "/admin/users",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("customers:read"),
  adminListUsers,
);

router.get(
  "/admin/users/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("customers:read"),
  adminGetUser,
);

router.patch(
  "/admin/users/:id/ban",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("customers:manage"),
  adminBanUser,
);

router.patch(
  "/admin/users/:id/unban",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("customers:manage"),
  adminUnbanUser,
);

export default router;
