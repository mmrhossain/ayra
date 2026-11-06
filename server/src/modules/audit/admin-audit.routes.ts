import { Router } from "express";
import {
  requireAdminAction,
  requireAuth,
  requireRole,
} from "../../common/middleware/auth.middleware.ts";
import {
  exportAdminAuditLogsHandler,
  getAdminAuditLogHandler,
  listAdminAuditLogsHandler,
} from "./admin-audit.controller.ts";

const router = Router();

router.get(
  "/admin/audit-log",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("audit:read"),
  listAdminAuditLogsHandler,
);

router.get(
  "/admin/audit-log/export",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("audit:read"),
  exportAdminAuditLogsHandler,
);

router.get(
  "/admin/audit-log/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("audit:read"),
  getAdminAuditLogHandler,
);

export default router;
