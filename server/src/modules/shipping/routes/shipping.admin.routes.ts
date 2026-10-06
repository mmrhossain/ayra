import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import {
  adminCreateMethodHandler,
  adminCreateRateHandler,
  adminCreateZoneHandler,
  adminDeleteRateHandler,
  adminDeleteZoneHandler,
  adminGetMethodHandler,
  adminGetRateHandler,
  adminGetZoneHandler,
  adminListMethodsHandler,
  adminListRatesHandler,
  adminListZonesHandler,
  adminUpdateMethodHandler,
  adminUpdateRateHandler,
  adminUpdateZoneHandler,
} from "../controllers/shipping.controller.ts";

const router = Router();
const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/shipping/zones", ...adminOnly, adminListZonesHandler);
router.post("/admin/shipping/zones", ...adminOnly, adminCreateZoneHandler);
router.get("/admin/shipping/zones/:id", ...adminOnly, adminGetZoneHandler);
router.put("/admin/shipping/zones/:id", ...adminOnly, adminUpdateZoneHandler);
router.delete("/admin/shipping/zones/:id", ...adminOnly, adminDeleteZoneHandler);

router.get("/admin/shipping/methods", ...adminOnly, adminListMethodsHandler);
router.post("/admin/shipping/methods", ...adminOnly, adminCreateMethodHandler);
router.get("/admin/shipping/methods/:id", ...adminOnly, adminGetMethodHandler);
router.put("/admin/shipping/methods/:id", ...adminOnly, adminUpdateMethodHandler);

router.get("/admin/shipping/rates", ...adminOnly, adminListRatesHandler);
router.post("/admin/shipping/rates", ...adminOnly, adminCreateRateHandler);
router.get("/admin/shipping/rates/:id", ...adminOnly, adminGetRateHandler);
router.put("/admin/shipping/rates/:id", ...adminOnly, adminUpdateRateHandler);
router.delete("/admin/shipping/rates/:id", ...adminOnly, adminDeleteRateHandler);

export default router;
