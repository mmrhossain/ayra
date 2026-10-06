import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import {
  adminGetSliderHandler,
  adminListSlidersHandler,
  createSliderHandler,
  deleteSliderHandler,
  listActiveSlidersHandler,
  updateSliderHandler,
} from "../controllers/slider.controller.ts";

const router = Router();

// router.get("/sliders", listActiveSlidersHandler);
router.get("/sliders/active", listActiveSlidersHandler);

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/sliders", ...adminOnly, adminListSlidersHandler);
router.get("/admin/sliders/:id", ...adminOnly, adminGetSliderHandler);
router.post("/admin/sliders", ...adminOnly, createSliderHandler);
router.patch("/admin/sliders/:id", ...adminOnly, updateSliderHandler);
router.delete("/admin/sliders/:id", ...adminOnly, deleteSliderHandler);

export default router;
