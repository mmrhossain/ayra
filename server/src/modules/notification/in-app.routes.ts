import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware.ts";
import {
  getInAppUnreadCountHandler,
  listInAppNotificationsHandler,
  markAllInAppNotificationsReadHandler,
  markInAppNotificationReadHandler,
} from "./in-app.controller.ts";

const router = Router();

router.get(
  "/notifications",
  requireAuth,
  listInAppNotificationsHandler,
);
router.get(
  "/notifications/unread-count",
  requireAuth,
  getInAppUnreadCountHandler,
);
router.patch(
  "/notifications/read-all",
  requireAuth,
  markAllInAppNotificationsReadHandler,
);
router.patch(
  "/notifications/:id/read",
  requireAuth,
  markInAppNotificationReadHandler,
);

export default router;
