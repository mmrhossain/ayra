import { Router } from "express";
import { successResponse } from "../../common/utils/response.ts";
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

// Server Actions use the current permission record, not the session snapshot.
router.get("/session/access", requireAuth, (req, res) => {
  const user = req.auth!.user;
  res.setHeader("Cache-Control", "private, no-store");
  successResponse(res, {
    role: user.role,
    staffStatus: user.staffStatus,
    banned: user.banned,
    isSuperAdmin: user.isSuperAdmin,
    adminPermissions: user.adminPermissions,
  }, "Session access fetched");
});

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
