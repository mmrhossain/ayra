import { Router, type NextFunction, type Request, type Response } from "express";
import { AppError } from "../../../common/errors/AppError.ts";
import {
  requireAdminAction,
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import { hasAdminAction } from "../../../common/utils/admin-permissions.ts";
import {
  getAdminSettingsHandler,
  listSettingsAuditHandler,
  updateSettingsGroupHandler,
} from "../controllers/settings.controller.ts";

const router = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];

/**
 * Editing a settings group is a write. The payment group additionally holds
 * gateway credentials, so it requires the dedicated `settings:secrets` action
 * rather than a broad `settings` scope.
 */
const requireSettingsWrite =
  (readGroup: (req: Request) => string | undefined) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.auth?.user;
    if (!user || !hasAdminAction(user, "settings:write")) {
      throw new AppError("Forbidden: insufficient admin permissions", 403);
    }

    const group = readGroup(req);
    if (group === "payment" && !hasAdminAction(user, "settings:secrets")) {
      throw new AppError(
        "Forbidden: integration secrets require elevated permission",
        403,
      );
    }
    next();
  };

router.get(
  "/admin/settings",
  ...adminOnly,
  requireAdminAction("settings:read"),
  getAdminSettingsHandler,
);

router.get(
  "/admin/settings/audit",
  ...adminOnly,
  requireAdminAction("audit:read"),
  listSettingsAuditHandler,
);

router.patch(
  "/admin/settings/:group",
  ...adminOnly,
  requireSettingsWrite((req) =>
    typeof req.params.group === "string" ? req.params.group : undefined,
  ),
  updateSettingsGroupHandler,
);

export default router;
