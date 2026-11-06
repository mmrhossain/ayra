import { describe, expect, it } from "vitest";
import {
  parseAuditTarget,
  redactAuditPayload,
  shouldAuditMethod,
} from "../../src/modules/audit/admin-audit.utils.ts";

describe("shouldAuditMethod", () => {
  it("audits mutating methods only", () => {
    expect(shouldAuditMethod("POST")).toBe(true);
    expect(shouldAuditMethod("patch")).toBe(true);
    expect(shouldAuditMethod("PUT")).toBe(true);
    expect(shouldAuditMethod("DELETE")).toBe(true);
    expect(shouldAuditMethod("GET")).toBe(false);
    expect(shouldAuditMethod("OPTIONS")).toBe(false);
  });
});

describe("parseAuditTarget", () => {
  it("extracts entity type and id from an admin path", () => {
    expect(
      parseAuditTarget("/api/v1/admin/orders/7f6a6c3e-1a2b-4c5d-8e9f-000000000000?x=1"),
    ).toEqual({
      path: "/api/v1/admin/orders/7f6a6c3e-1a2b-4c5d-8e9f-000000000000",
      entityType: "orders",
      entityId: "7f6a6c3e-1a2b-4c5d-8e9f-000000000000",
    });
  });

  it("does not treat action segments as entity ids", () => {
    expect(parseAuditTarget("/api/v1/admin/orders/bulk").entityId).toBeUndefined();
    expect(
      parseAuditTarget("/api/v1/admin/settings/audit").entityId,
    ).toBeUndefined();
  });

  it("handles the admin root path", () => {
    expect(parseAuditTarget("/api/v1/admin")).toEqual({
      path: "/api/v1/admin",
      entityType: undefined,
      entityId: undefined,
    });
  });
});

describe("redactAuditPayload", () => {
  it("redacts sensitive keys recursively", () => {
    const redacted = redactAuditPayload({
      email: "admin@example.com",
      password: "super-secret",
      nested: { accessToken: "abc", note: "ok" },
    });

    expect(redacted).toEqual({
      email: "admin@example.com",
      password: "[redacted]",
      nested: { accessToken: "[redacted]", note: "ok" },
    });
  });

  it("truncates long strings and arrays", () => {
    const redacted = redactAuditPayload({
      body: "a".repeat(600),
      items: Array.from({ length: 30 }, (_, index) => index),
    }) as { body: string; items: number[] };

    expect(redacted.body).toHaveLength(503);
    expect(redacted.body.endsWith("...")).toBe(true);
    expect(redacted.items).toHaveLength(20);
  });

  it("stops deep recursion", () => {
    const deep = { a: { b: { c: { d: "hidden" } } } };
    expect(redactAuditPayload(deep)).toEqual({
      a: { b: { c: "[truncated]" } },
    });
  });
});
