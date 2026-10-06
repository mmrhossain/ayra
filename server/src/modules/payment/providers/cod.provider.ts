import type {
  GatewayOrder,
  GatewayUrls,
  PaymentProvider,
} from "../types.ts";

export const codProvider: PaymentProvider = {
  method: "COD",

  async initiate(_order: GatewayOrder, _callbacks: GatewayUrls) {
    return {
      checkoutUrl: null,
      providerReference: "",
      paymentStatus: "PENDING",
      expiresAt: undefined,
    };
  },

  async verifyTransaction() {
    return {
      valid: false,
      providerReference: "",
      transactionId: "",
      amount: undefined,
      currency: undefined,
      raw: null,
    };
  },

  verifyWebhookSignature() {
    return false;
  },
};
