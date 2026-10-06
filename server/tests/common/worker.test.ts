import { describe, expect, it } from "vitest";
import { waitWhileBusy } from "../../src/common/utils/worker.ts";

describe("waitWhileBusy", () => {
  it("returns immediately when idle", async () => {
    const started = Date.now();
    await waitWhileBusy(() => false, 1_000);
    expect(Date.now() - started).toBeLessThan(200);
  });

  it("waits until the cycle finishes", async () => {
    let busy = true;
    setTimeout(() => {
      busy = false;
    }, 80);
    const started = Date.now();
    await waitWhileBusy(() => busy, 1_000);
    expect(Date.now() - started).toBeGreaterThanOrEqual(50);
    expect(busy).toBe(false);
  });
});
