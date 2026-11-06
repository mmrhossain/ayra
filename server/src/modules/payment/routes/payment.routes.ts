import { Router } from "express";
import { requireAuth, requireCustomer } from "../../../common/middleware/auth.middleware.ts";

import {
  initiatePaymentHandler,
  sslcommerzCancelHandler,
  sslcommerzFailHandler,
  sslcommerzIpnHandler,
  sslcommerzSuccessHandler,
} from "../controllers/payment.controller.ts";

const router = Router();

router.post(
    "/payments/:orderId/initiate",
    requireAuth,
    requireCustomer,
    initiatePaymentHandler
);

// SSLCommerz redirects can be GET or POST depending on gateway configurations
router.all("/payments/sslcommerz/success", sslcommerzSuccessHandler);
router.all("/payments/sslcommerz/failed", sslcommerzFailHandler);
router.all("/payments/sslcommerz/cancelled", sslcommerzCancelHandler);
router.post("/payments/sslcommerz/ipn", sslcommerzIpnHandler);

export default router;