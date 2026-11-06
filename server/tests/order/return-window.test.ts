import { describe, expect, it } from "vitest";
import {
  getReturnDeadline,
  isReturnWindowOpen,
  RETURN_WINDOW_DAYS,
} from "../../src/modules/order/utils/return-window.ts";

describe("Return window", () => {
  it("closes 14 days after delivery", () => {
    const deliveredAt = new Date("2026-01-01T10:00:00.000Z");
    expect(RETURN_WINDOW_DAYS).toBe(14);
    expect(getReturnDeadline(deliveredAt).toISOString()).toBe(
      "2026-01-15T10:00:00.000Z",
    );
    expect(deliveredAt.toISOString()).toBe("2026-01-01T10:00:00.000Z");
  });

  it("stays open up to the deadline and closes after it", () => {
    const deliveredAt = new Date("2026-01-01T10:00:00.000Z");
    const deadline = getReturnDeadline(deliveredAt);

    expect(isReturnWindowOpen(deliveredAt, deadline)).toBe(true);
    expect(
      isReturnWindowOpen(deliveredAt, new Date(deadline.getTime() + 1)),
    ).toBe(false);
  });

  it("treats missing delivery timestamps as closed", () => {
    expect(isReturnWindowOpen(null)).toBe(false);
    expect(isReturnWindowOpen(undefined)).toBe(false);
  });
});
