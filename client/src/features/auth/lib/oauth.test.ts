import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./oauth";

describe("safeRedirectPath", () => {
  it("keeps relative paths", () => {
    expect(safeRedirectPath("/orders")).toBe("/orders");
    expect(safeRedirectPath("/orders?tab=open")).toBe("/orders?tab=open");
  });

  it("falls back to root for missing values", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("rejects protocol-relative and encoded paths", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/");
    expect(safeRedirectPath("/%2F%2Fevil.example")).toBe("/");
    expect(safeRedirectPath("/%5Cevil.example")).toBe("/");
  });

  it("rejects backslashes and control characters", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/");
    expect(safeRedirectPath("/%0d%0aX-Injected: 1")).toBe("/");
  });

  it("rejects malformed percent encoding", () => {
    expect(safeRedirectPath("/%E0%A4%A")).toBe("/");
  });
});
