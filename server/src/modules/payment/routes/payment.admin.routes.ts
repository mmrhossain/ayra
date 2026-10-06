import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import {
  adminGetPaymentHandler,
  adminListPaymentsHandler,
  collectCodPaymentHandler,
  refundPaymentHandler,
} from "../controllers/payment.controller.ts";

const router = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.get("/admin/payments", ...adminOnly, adminListPaymentsHandler);
router.get("/admin/payments/:id", ...adminOnly, adminGetPaymentHandler);

router.post(
  "/admin/payments/cod/:paymentId/collect",
  ...adminOnly,
  collectCodPaymentHandler
);

router.post(
  "/admin/payments/:paymentId/refund",
  ...adminOnly,
  refundPaymentHandler
);

export default router;
