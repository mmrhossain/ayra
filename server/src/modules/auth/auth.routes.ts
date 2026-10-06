import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../common/middleware/auth.middleware.ts";

import {
  vendorApply,
  adminListUsers,
  adminGetUser,
  adminApproveUser,
  adminBanUser,
  adminUnbanUser,
} from "./auth.controller.ts";

const router = Router();



router.post(
  "/auth/vendor/apply",
  requireAuth,
  vendorApply
);

router.get(
  "/admin/users",
  requireAuth,
  requireRole("ADMIN"),
  adminListUsers
);

router.get(
  "/admin/users/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminGetUser
);

router.post(
  "/admin/users/:id/approve",
  requireAuth,
  requireRole("ADMIN"),
  adminApproveUser
);

router.patch(
  "/admin/users/:id/ban",
  requireAuth,
  requireRole("ADMIN"),
  adminBanUser
);

router.patch(
  "/admin/users/:id/unban",
  requireAuth,
  requireRole("ADMIN"),
  adminUnbanUser
);

export default router;
