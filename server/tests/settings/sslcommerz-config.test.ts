import { env } from "../../src/config/env.ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const values: Record<string, unknown> = {};

vi.mock("../../src/modules/settings/settings.service.ts", () => ({
  getSettingValue: vi.fn(async (key: string) => values[key]),
}));

const {
  getPaymentFrontendUrl,
  getSslcommerzCallbackUrls,
  getSslcommerzRuntimeConfig,
} = await import("../../src/modules/payment/services/sslcommerz-config.service.ts");

const originalEnvironment = { isDevelopment: env.isDevelopment, FRONTEND_URL: env.FRONTEND_URL, PAYMENT_CALLBACK_BASE_URL: env.PAYMENT_CALLBACK_BASE_URL };
afterEach(() => Object.assign(env, originalEnvironment));

const baseValues = () => ({
  "payment.sslcommerz.mode": "sandbox",
  "payment.sslcommerz.sandboxStoreId": "sandbox-id",
  "payment.sslcommerz.sandboxStorePassword": "sandbox-pass",
  "payment.sslcommerz.liveStoreId": "live-id",
  "payment.sslcommerz.liveStorePassword": "live-pass",
  "payment.callbackBaseUrl": "https://api.example.com/",
  "store.frontendUrl": "https://shop.example.com/",
});

beforeEach(() => {
  for (const key of Object.keys(values)) delete values[key];
  Object.assign(values, baseValues());
});

describe("SSLCommerz runtime settings", () => {
  it("uses development origins instead of saved production URLs", async () => {
    env.isDevelopment = true;
    env.FRONTEND_URL = "http://localhost:3000/";
    env.PAYMENT_CALLBACK_BASE_URL = "http://localhost:5000/";
    expect(await getPaymentFrontendUrl()).toBe("http://localhost:3000");
    expect((await getSslcommerzCallbackUrls()).successUrl).toBe("http://localhost:5000/api/v1/payments/sslcommerz/success");
  });
  it("supports a development HTTPS tunnel for gateway callbacks and IPN", async () => {
    env.isDevelopment = true;
    env.PAYMENT_CALLBACK_BASE_URL = "https://local-api.example.com/";
    const urls = await getSslcommerzCallbackUrls();
    expect(urls.ipnUrl).toBe("https://local-api.example.com/api/v1/payments/sslcommerz/ipn");
    expect(urls.cancelUrl).toBe("https://local-api.example.com/api/v1/payments/sslcommerz/cancelled");
  });
  it("uses the local backend port if no development callback override is set", async () => {
    env.isDevelopment = true;
    env.PAYMENT_CALLBACK_BASE_URL = undefined;
    expect((await getSslcommerzCallbackUrls()).failUrl).toBe(
      "http://localhost:" + env.PORT + "/api/v1/payments/sslcommerz/failed",
    );
  });
  it("keeps saved production callback and frontend settings", async () => {
    env.isDevelopment = false;
    env.FRONTEND_URL = "http://localhost:3000";
    env.PAYMENT_CALLBACK_BASE_URL = "http://localhost:5000";
    expect(await getPaymentFrontendUrl()).toBe("https://shop.example.com");
    expect((await getSslcommerzCallbackUrls()).successUrl).toBe("https://api.example.com/api/v1/payments/sslcommerz/success");
  });

  it("builds callback URLs from the configured base URL", async () => {
    expect(await getSslcommerzCallbackUrls()).toEqual({
      successUrl: "https://api.example.com/api/v1/payments/sslcommerz/success",
      failUrl: "https://api.example.com/api/v1/payments/sslcommerz/failed",
      cancelUrl: "https://api.example.com/api/v1/payments/sslcommerz/cancelled",
      ipnUrl: "https://api.example.com/api/v1/payments/sslcommerz/ipn",
    });
  });

  it("selects credentials for the active mode", async () => {
    expect(await getSslcommerzRuntimeConfig()).toMatchObject({
      mode: "sandbox",
      storeId: "sandbox-id",
      storePassword: "sandbox-pass",
    });

    values["payment.sslcommerz.mode"] = "live";
    expect(await getSslcommerzRuntimeConfig()).toMatchObject({
      mode: "live",
      storeId: "live-id",
      storePassword: "live-pass",
    });
  });

  it("fails with 503 when the active mode has no credentials", async () => {
    values["payment.sslcommerz.sandboxStorePassword"] = "";

    await expect(getSslcommerzRuntimeConfig()).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});
