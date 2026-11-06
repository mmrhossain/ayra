import { Router } from "express";
import {
  requireAdminAction,
  requireAuth,
  requireRole,
} from "../../../common/middleware/auth.middleware.ts";
import {
  adminGetPaymentHandler,
  adminListPaymentsHandler,
  adminListRefundsHandler,
  collectCodPaymentHandler,
  refundPaymentHandler,
  updateRefundStatusHandler,
} from "../controllers/payment.controller.ts";

const router = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];
const canReadRefunds = [...adminOnly, requireAdminAction("refunds:read")];
const canCreateRefund = [...adminOnly, requireAdminAction("refunds:create")];
const canApproveRefund = [...adminOnly, requireAdminAction("refunds:approve")];

router.get("/admin/payments", ...adminOnly, adminListPaymentsHandler);
router.get("/admin/refunds", ...canReadRefunds, adminListRefundsHandler);
router.get("/admin/payments/:id", ...adminOnly, adminGetPaymentHandler);

router.post(
  "/admin/payments/cod/:paymentId/collect",
  ...adminOnly,
  collectCodPaymentHandler
);

router.post(
  "/admin/payments/:paymentId/refund",
  ...canCreateRefund,
  refundPaymentHandler
);

// Status changes include approval/rejection and completion, so they require
// the explicit approve action rather than the broad orders scope.
router.patch(
  "/admin/refunds/:refundId",
  ...canApproveRefund,
  updateRefundStatusHandler
);

export default router;
