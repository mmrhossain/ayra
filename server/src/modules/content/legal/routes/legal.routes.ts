import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import {
  adminCreateLegalHandler,
  adminListLegalHandler,
  adminPublishLegalHandler,
  adminUpdateLegalHandler,
  getLegalHandler,
} from "../controllers/legal.controller.ts";

const router = Router();

router.get("/legal/:type", getLegalHandler);

router.get("/admin/legal", requireAuth, requireRole("ADMIN"), adminListLegalHandler);
router.post("/admin/legal", requireAuth, requireRole("ADMIN"), adminCreateLegalHandler);
router.put("/admin/legal/:id", requireAuth, requireRole("ADMIN"), adminUpdateLegalHandler);
router.post(
  "/admin/legal/:id/publish",
  requireAuth,
  requireRole("ADMIN"),
  adminPublishLegalHandler
);

export default router;
