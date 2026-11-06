import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../common/middleware/auth.middleware.ts";
import {
  bookCourierHandler,
  courierWebhookHandler,
} from "./courier.controller.ts";

const router = Router();

router.post(
  "/admin/shipments/:id/courier",
  requireAuth,
  requireRole("ADMIN"),
  bookCourierHandler,
);

router.post("/webhooks/couriers/:provider", courierWebhookHandler);

export default router;
