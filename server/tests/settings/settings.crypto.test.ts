import { afterEach, describe, expect, it } from "vitest";
import { env } from "../../src/config/env.ts";
import {
  decryptSecret,
  encryptSecret,
  isSecretEnvelope,
  last4,
} from "../../src/modules/settings/settings.crypto.ts";

const originalSecret = env.BETTER_AUTH_SECRET;
const originalSettingsKey = env.SETTINGS_ENCRYPTION_KEY;

afterEach(() => {
  env.BETTER_AUTH_SECRET = originalSecret;
  env.SETTINGS_ENCRYPTION_KEY = originalSettingsKey;
});

describe("platform settings secret encryption", () => {
  it("round-trips a secret", () => {
    const envelope = encryptSecret("payment.sslcommerz.liveStorePassword", "s3cret-value");

    expect(isSecretEnvelope(envelope)).toBe(true);
    expect(envelope.ct).not.toContain("s3cret-value");
    expect(
      decryptSecret("payment.sslcommerz.liveStorePassword", envelope),
    ).toBe("s3cret-value");
  });

  it("binds ciphertext to the setting key", () => {
    const envelope = encryptSecret("payment.sslcommerz.sandboxStorePassword", "value");

    expect(() =>
      decryptSecret("payment.sslcommerz.liveStorePassword", envelope),
    ).toThrow();
  });

  it("fails when the master secret changes", () => {
    const envelope = encryptSecret("payment.sslcommerz.liveStorePassword", "value");
    env.BETTER_AUTH_SECRET = `${originalSecret}-rotated`;

    expect(() =>
      decryptSecret("payment.sslcommerz.liveStorePassword", envelope),
    ).toThrow();
  });

  it("prefers the dedicated settings key over the auth secret", () => {
    env.SETTINGS_ENCRYPTION_KEY = "dedicated-settings-key-for-tests";
    const envelope = encryptSecret("payment.sslcommerz.liveStorePassword", "value");
    env.SETTINGS_ENCRYPTION_KEY = undefined;

    expect(() =>
      decryptSecret("payment.sslcommerz.liveStorePassword", envelope),
    ).toThrow();
  });

  it("rejects tampered ciphertext", () => {
    const envelope = encryptSecret("payment.sslcommerz.liveStorePassword", "value");
    const tampered = {
      ...envelope,
      ct: Buffer.from("tampered").toString("base64"),
    };

    expect(() =>
      decryptSecret("payment.sslcommerz.liveStorePassword", tampered),
    ).toThrow();
  });

  it("masks all but the last four characters", () => {
    expect(last4("abcdef1234")).toBe("****1234");
    expect(last4("abc")).toBe("****");
  });
});
