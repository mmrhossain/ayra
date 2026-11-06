import { beforeEach, describe, expect, it, vi } from "vitest";

const values: Record<string, unknown> = {};

vi.mock("../../src/modules/settings/settings.service.ts", () => ({
  getSettingValue: vi.fn(async (key: string) => values[key]),
}));

const {
  getSslcommerzCallbackUrls,
  getSslcommerzRuntimeConfig,
} = await import("../../src/modules/payment/services/sslcommerz-config.service.ts");

const baseValues = () => ({
  "payment.sslcommerz.mode": "sandbox",
  "payment.sslcommerz.sandboxStoreId": "sandbox-id",
  "payment.sslcommerz.sandboxStorePassword": "sandbox-pass",
  "payment.sslcommerz.liveStoreId": "live-id",
  "payment.sslcommerz.liveStorePassword": "live-pass",
  "payment.callbackBaseUrl": "https://api.example.com/",
});

beforeEach(() => {
  for (const key of Object.keys(values)) delete values[key];
  Object.assign(values, baseValues());
});

describe("SSLCommerz runtime settings", () => {
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
