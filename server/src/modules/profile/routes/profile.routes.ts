import { Router } from "express";
import {
  requireAuth,
  requireCustomer,
} from "../../../common/middleware/auth.middleware.ts";
import {
  getCustomerProfileHandler,
  getNotificationPreferencesHandler,
  saveCustomerProfileHandler,
  saveNotificationPreferencesHandler,
} from "../controllers/profile.controller.ts";

const router = Router();

router.get("/customer/profile", requireAuth, requireCustomer, getCustomerProfileHandler);
router.patch("/customer/profile", requireAuth, requireCustomer, saveCustomerProfileHandler);
router.get(
  "/customer/notification-preferences",
  requireAuth,
  requireCustomer,
  getNotificationPreferencesHandler
);
router.patch(
  "/customer/notification-preferences",
  requireAuth,
  requireCustomer,
  saveNotificationPreferencesHandler
);
export default router;
