import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import { contactLimiter } from "../../../../common/middleware/rate-limit.middleware.ts";
import {
  adminListContactMessagesHandler,
  adminUpdateContactMessageHandler,
  createContactMessageHandler,
} from "../controllers/contact.controller.ts";

const router = Router();

router.post("/contact-messages", contactLimiter, createContactMessageHandler);
router.get(
  "/admin/contact-messages",
  requireAuth,
  requireRole("ADMIN"),
  adminListContactMessagesHandler,
);
router.patch(
  "/admin/contact-messages/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminUpdateContactMessageHandler,
);

export default router;
