import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  hashPayload,
  mapCourierStatus,
  safeSecretEqual,
  verifyHmacSignature,
} from "../../src/modules/courier/courier.utils.ts";

describe("courier status mapping", () => {
  it("maps common Pathao statuses", () => {
    expect(mapCourierStatus("Pickup_Requested")).toBe("PICKUP_REQUESTED");
    expect(mapCourierStatus("Picked_Up")).toBe("PICKED_UP");
    expect(mapCourierStatus("In_Transit")).toBe("IN_TRANSIT");
    expect(mapCourierStatus("Delivered")).toBe("DELIVERED");
  });

  it("maps common Steadfast statuses", () => {
    expect(mapCourierStatus("in_review")).toBeNull();
    expect(mapCourierStatus("cancelled")).toBe("CANCELLED");
    expect(mapCourierStatus("partial_delivered")).toBeNull();
    expect(mapCourierStatus("delivery_failed")).toBe("FAILED");
  });

  it("normalizes separators and rejects unknown values", () => {
    expect(mapCourierStatus("OUT-FOR-DELIVERY")).toBe("OUT_FOR_DELIVERY");
    expect(mapCourierStatus("out for delivery")).toBe("OUT_FOR_DELIVERY");
    expect(mapCourierStatus("teleported")).toBeNull();
    expect(mapCourierStatus(null)).toBeNull();
  });
});

describe("courier webhook security", () => {
  const secret = "test-webhook-secret";
  const body = Buffer.from('{"status":"delivered"}');

  it("verifies an HMAC signature over the raw body", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyHmacSignature(body, signature, secret)).toBe(true);
    expect(verifyHmacSignature(body, signature.toUpperCase(), secret)).toBe(
      true,
    );
  });

  it("rejects tampered or missing signatures", () => {
    expect(verifyHmacSignature(Buffer.from("{}"), "abc", secret)).toBe(false);
    expect(verifyHmacSignature(body, undefined, secret)).toBe(false);
    expect(verifyHmacSignature(body, "abc", undefined)).toBe(false);
  });

  it("compares shared secrets without leaking length", () => {
    expect(safeSecretEqual("same", "same")).toBe(true);
    expect(safeSecretEqual("same", "other")).toBe(false);
    expect(safeSecretEqual(undefined, "same")).toBe(false);
  });

  it("hashes payloads deterministically", () => {
    expect(hashPayload({ a: 1 })).toBe(hashPayload({ a: 1 }));
    expect(hashPayload({ a: 1 })).not.toBe(hashPayload({ a: 2 }));
  });
});
