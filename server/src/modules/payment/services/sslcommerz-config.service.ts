import { env } from "../../../config/env.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { getSettingValue } from "../../settings/settings.service.ts";
import type { GatewayUrls } from "../types.ts";

export type SslcommerzMode = "sandbox" | "live";

export type SslcommerzRuntimeConfig = {
  mode: SslcommerzMode;
  storeId: string;
  storePassword: string;
  callbackBaseUrl: string;
};

const trimUrl = (value: string) => value.trim().replace(/\/+$/, "");

export const getSslcommerzRuntimeConfig =
  async (): Promise<SslcommerzRuntimeConfig> => {
    const [mode, sandboxStoreId, sandboxStorePassword, liveStoreId, liveStorePassword, callbackBaseUrl] =
      await Promise.all([
        getSettingValue<SslcommerzMode>("payment.sslcommerz.mode"),
        getSettingValue<string>("payment.sslcommerz.sandboxStoreId"),
        getSettingValue<string>("payment.sslcommerz.sandboxStorePassword"),
        getSettingValue<string>("payment.sslcommerz.liveStoreId"),
        getSettingValue<string>("payment.sslcommerz.liveStorePassword"),
        env.isDevelopment
          ? Promise.resolve(env.PAYMENT_CALLBACK_BASE_URL || `http://localhost:${env.PORT}`)
          : getSettingValue<string>("payment.callbackBaseUrl"),
      ]);

    const storeId = mode === "sandbox" ? sandboxStoreId : liveStoreId;
    const storePassword =
      mode === "sandbox" ? sandboxStorePassword : liveStorePassword;

    if (!storeId || !storePassword) {
      throw new AppError(
        `SSLCommerz ${mode} credentials are not configured`,
        503,
      );
    }

    return {
      mode,
      storeId,
      storePassword,
      callbackBaseUrl: trimUrl(callbackBaseUrl),
    };
  };

export const getSslcommerzCallbackUrls = async (): Promise<GatewayUrls> => {
  const { callbackBaseUrl } = await getSslcommerzRuntimeConfig();
  const base = `${callbackBaseUrl}/api/v1/payments/sslcommerz`;

  return {
    successUrl: `${base}/success`,
    failUrl: `${base}/failed`,
    cancelUrl: `${base}/cancelled`,
    ipnUrl: `${base}/ipn`,
  };
};

// Shared production settings must not redirect local payment returns to production.
export const getPaymentFrontendUrl = async (): Promise<string> => trimUrl(
  env.isDevelopment ? env.FRONTEND_URL : await getSettingValue<string>("store.frontendUrl"),
);
