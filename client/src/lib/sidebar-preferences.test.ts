import { describe, expect, it } from "vitest";

import {
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  parseSidebarOpen,
  serializeSidebarOpen,
} from "./sidebar-preferences";

describe("sidebar preference persistence", () => {
  it("defaults to expanded when no cookie exists", () => {
    expect(parseSidebarOpen(undefined)).toBe(true);
  });

  it("restores expanded and collapsed states", () => {
    expect(parseSidebarOpen("true")).toBe(true);
    expect(parseSidebarOpen("false")).toBe(false);
  });

  it("defaults to expanded for malformed values", () => {
    expect(parseSidebarOpen("collapsed")).toBe(true);
  });

  it("writes and reads the same cookie name", () => {
    expect(serializeSidebarOpen(false)).toBe(
      `${SIDEBAR_COOKIE_NAME}=false; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`,
    );
    expect(SIDEBAR_COOKIE_NAME).toBe("sidebar_state");
  });

  it("round-trips the collapsed state across a reload", () => {
    for (const open of [true, false]) {
      const cookie = serializeSidebarOpen(open);
      const value = cookie.split(";")[0]?.split("=")[1];

      expect(parseSidebarOpen(value)).toBe(open);
    }
  });
});
