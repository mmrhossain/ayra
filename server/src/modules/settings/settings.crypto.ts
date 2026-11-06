import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { env } from "../../config/env.ts";
import type { SecretEnvelope } from "./types.ts";

const ENVELOPE_VERSION = 1;

const encryptionKey = () => {
  if (env.SETTINGS_ENCRYPTION_KEY) {
    return createHash("sha256").update(env.SETTINGS_ENCRYPTION_KEY).digest();
  }

  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update("platform-settings-v1")
    .digest();
};

export const isSecretEnvelope = (value: unknown): value is SecretEnvelope => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.v === ENVELOPE_VERSION &&
    typeof candidate.iv === "string" &&
    typeof candidate.tag === "string" &&
    typeof candidate.ct === "string"
  );
};

export const encryptSecret = (settingKey: string, plaintext: string): SecretEnvelope => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(settingKey, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    v: ENVELOPE_VERSION,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ct: ciphertext.toString("base64"),
  };
};

export const decryptSecret = (
  settingKey: string,
  envelope: SecretEnvelope,
): string => {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAAD(Buffer.from(settingKey, "utf8"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ct, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
};

export const last4 = (value: string) =>
  value.length <= 4 ? "****" : `****${value.slice(-4)}`;
