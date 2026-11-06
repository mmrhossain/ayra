import { createHash } from "node:crypto";
import { AppError } from "../../../common/errors/AppError.ts";
import { getSslcommerzRuntimeConfig } from "../services/sslcommerz-config.service.ts";
import type {
  GatewayOrder,
  GatewaySession,
  GatewayUrls,
  GatewayVerification,
  PaymentProvider,
} from "../types.ts";

const SESSION_ENDPOINTS = {
  live: "https://securepay.sslcommerz.com/gwprocess/v4/api.php",
  sandbox: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
};

const VALIDATION_ENDPOINTS = {
  live: "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php",
  sandbox: "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
};

interface SslcommerzSessionResponse {
  status?: string;
  GatewayPageURL?: string;
  tran_id?: string;
  failedreason?: string;
  [key: string]: unknown;
}

interface SslcommerzValidationResponse {
  status?: string;
  tran_id?: string;
  val_id?: string;
  bank_tran_id?: string;
  amount?: string;
  currency?: string;
  [key: string]: unknown;
}

const FETCH_TIMEOUT_MS = 10_000;

export const sslcommerzProvider: PaymentProvider = {
  method: "SSLCOMMERZ",

  async initiate(
    order: GatewayOrder,
    callbacks: GatewayUrls
  ): Promise<GatewaySession> {
    const { storeId, storePassword, mode } = await getSslcommerzRuntimeConfig();

    const endpoint =
      mode === "sandbox" ? SESSION_ENDPOINTS.sandbox : SESSION_ENDPOINTS.live;

    const payload = new URLSearchParams();
    payload.set("store_id", storeId);
    payload.set("store_passwd", storePassword);
    payload.set("total_amount", order.grandTotal.toFixed(2));
    payload.set("currency", order.currency);
    payload.set("tran_id", order.orderNumber);
    payload.set("success_url", callbacks.successUrl);
    payload.set("fail_url", callbacks.failUrl);
    payload.set("cancel_url", callbacks.cancelUrl);
    payload.set("ipn_url", callbacks.ipnUrl);
    payload.set("cus_name", order.customerName);
    payload.set("cus_email", order.customerEmail);
    payload.set("cus_phone", order.customerPhone);
    payload.set("cus_add1", order.customerAddress ?? "");
    payload.set("cus_city", order.customerCity ?? "");
    payload.set("cus_postcode", order.customerPostCode ?? "");
    payload.set("cus_state", order.customerState ?? "");
    payload.set("cus_country", order.customerCountry ?? "Bangladesh");
    payload.set("shipping_method", "YES");
    payload.set("ship_name", order.shippingName ?? order.customerName);
    payload.set("ship_add1", order.shippingAddress ?? order.customerAddress ?? "");
    payload.set("ship_city", order.shippingCity ?? order.customerCity ?? "");
    payload.set("ship_state", order.shippingState ?? order.customerState ?? "");
    payload.set("ship_postcode", order.shippingPostCode ?? order.customerPostCode ?? "");
    payload.set("ship_country", order.shippingCountry ?? order.customerCountry ?? "Bangladesh");
    if (order.shippingPhone) payload.set("ship_phone", order.shippingPhone);
    payload.set("num_of_item", "1");
    payload.set("product_name", `Order ${order.orderNumber}`);
    payload.set("product_category", "General");
    payload.set("product_profile", "general");

    let response: SslcommerzSessionResponse;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        throw new AppError("SSLCommerz session initiation failed", 502);
      }

      response = (await res.json()) as SslcommerzSessionResponse;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("SSLCommerz session initiation failed", 502);
    }

    if (response.status !== "SUCCESS" || !response.GatewayPageURL) {
      throw new AppError(
        response.failedreason || "SSLCommerz session initiation failed",
        502
      );
    }

    return {
      checkoutUrl: response.GatewayPageURL,
      providerReference: order.orderNumber,
      paymentStatus: "INITIATED",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  },

  async verifyTransaction(
    valId: string
  ): Promise<GatewayVerification> {
    const { storeId, storePassword, mode } = await getSslcommerzRuntimeConfig();

    const endpoint =
      mode === "sandbox" ? VALIDATION_ENDPOINTS.sandbox : VALIDATION_ENDPOINTS.live;

    const params = new URLSearchParams({
      val_id: valId,
      store_id: storeId,
      store_passwd: storePassword,
      format: "json",
    });

    let response: SslcommerzValidationResponse;

    try {
      const res = await fetch(`${endpoint}?${params.toString()}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        throw new AppError("Failed to verify SSLCommerz transaction", 502);
      }

      response = (await res.json()) as SslcommerzValidationResponse;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to verify SSLCommerz transaction", 502);
    }

    const valid = response.status === "VALID" || response.status === "VALIDATED";

    return {
      valid,
      providerReference: response.tran_id ?? valId,
      transactionId: response.tran_id ?? valId,
      amount: response.amount ? Number(response.amount) : undefined,
      currency: response.currency ?? undefined,
      raw: response,
    };
  },

  async verifyWebhookSignature(
    payload: Record<string, string>,
  ): Promise<boolean> {
    const verifySign = payload["verify_sign"];
    const verifyKey = payload["verify_key"];
    if (!verifySign || !verifyKey) return false;

    let storePassword: string;
    try {
      storePassword = (await getSslcommerzRuntimeConfig()).storePassword;
    } catch {
      return false;
    }

    const fields: Record<string, string> = {};
    for (const key of verifyKey.split(",")) {
      if (payload[key] !== undefined) fields[key] = String(payload[key]);
    }
    fields.store_passwd = createHash("md5").update(storePassword).digest("hex");

    const hashString = Object.keys(fields)
      .sort()
      .map((key) => `${key}=${fields[key]}`)
      .join("&");

    return createHash("md5").update(hashString).digest("hex") === verifySign;
  },
};
