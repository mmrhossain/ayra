import { afterEach, describe, expect, it, vi } from "vitest";
import { isTransientDbError, withDbRetry } from "../../src/common/utils/db-retry.ts";

describe("database read recovery", () => {
  afterEach(() => vi.useRealTimers());

  it("retries one lost connection and returns the recovered read", async () => {
    vi.useFakeTimers();
    const read = vi.fn().mockRejectedValueOnce({ code: "P1017" }).mockResolvedValueOnce("products");
    const result = withDbRetry(read, 2);
    await vi.advanceTimersByTimeAsync(250);
    await expect(result).resolves.toBe("products");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("stops after the configured attempts", async () => {
    vi.useFakeTimers();
    const failure = new Error("Connection terminated unexpectedly");
    const read = vi.fn().mockRejectedValue(failure);
    const result = expect(withDbRetry(read, 2)).rejects.toBe(failure);
    await vi.advanceTimersByTimeAsync(250);
    await result;
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("passes application errors through without retrying", async () => {
    const failure = new Error("Collection not found");
    const read = vi.fn().mockRejectedValue(failure);
    await expect(withDbRetry(read, 2)).rejects.toBe(failure);
    expect(read).toHaveBeenCalledTimes(1);
    expect(isTransientDbError({ message: 500 })).toBe(false);
  });
});
