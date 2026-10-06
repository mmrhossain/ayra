import type {
  PaymentMethod,
  PaymentTransactionStatus,
} from "../../generated/prisma/enums.ts";
import type { z } from "zod";
import type {
  initiatePaymentSchema,
  listPaymentsQuerySchema,
  refundSchema,
  sslcommerzFailCancelSchema,
  sslcommerzIpnSchema,
  sslcommerzSuccessSchema,
} from "./validators/payment.validators.ts";

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type SslcommerzSuccessInput = z.infer<typeof sslcommerzSuccessSchema>;
export type SslcommerzFailCancelInput = z.infer<typeof sslcommerzFailCancelSchema>;
export type SslcommerzIpnInput = z.infer<typeof sslcommerzIpnSchema>;

export type GatewayOrder = {
  id: string;
  orderNumber: string;
  grandTotal: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string | undefined;
  customerCity: string | undefined;
  customerPostCode: string | undefined;
  customerCountry: string | undefined;
  customerState: string | undefined;
  shippingName: string | undefined;
  shippingAddress: string | undefined;
  shippingCity: string | undefined;
  shippingState: string | undefined;
  shippingPostCode: string | undefined;
  shippingCountry: string | undefined;
  shippingPhone: string | undefined;
};

export type GatewayUrls = {
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
};

export type GatewaySession = {
  checkoutUrl: string | null;
  providerReference: string;
  paymentStatus: PaymentTransactionStatus;
  expiresAt: Date | undefined;
};

export type GatewayVerification = {
  valid: boolean;
  providerReference: string;
  transactionId: string;
  amount: number | undefined;
  currency: string | undefined;
  raw: unknown;
};

export type PaymentProvider = {
  readonly method: PaymentMethod;
  initiate(order: GatewayOrder, callbackUrls: GatewayUrls): Promise<GatewaySession>;
  verifyTransaction(valId: string): Promise<GatewayVerification>;
  verifyWebhookSignature(payload: Record<string, string>): boolean;
};

export type PublicPayment = {
  id: string;
  method: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: Date;
  orderId?: string;
};
