import { afterEach, describe, expect, it, vi } from "vitest";
import { createSharedRequest } from "./shared-request";
afterEach(() => vi.unstubAllGlobals());
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
describe("concurrent reads", () => {
  it("shares one pending request and never caches its completed result", async () => {
    const pending = deferred<number>();
    const fetch = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(2);
    const request = createSharedRequest(fetch);
    const first = request.read();
    const second = request.read();
    expect(first).toBe(second);
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);
    pending.resolve(1);
    expect(await first).toBe(1);
    expect(await request.read()).toBe(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("releases failed reads so retry starts a new request", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue("fresh");
    const request = createSharedRequest(fetch);
    await expect(request.read()).rejects.toThrow("offline");
    await expect(request.read()).resolves.toBe("fresh");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("starts a fresh read after mutation invalidation without an older response clearing it", async () => {
    const old = deferred<string>();
    const fresh = deferred<string>();
    const fetch = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
    const request = createSharedRequest(fetch);
    const first = request.read();
    request.invalidate();
    const second = request.read();
    old.resolve("old");
    await first;
    expect(request.read()).toBe(second);
    fresh.resolve("fresh");
    await expect(second).resolves.toBe("fresh");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("does not share requests on the server", async () => {
    vi.stubGlobal("window", undefined);
    const fetch = vi.fn().mockResolvedValue("session-specific");
    const request = createSharedRequest(fetch);
    await Promise.all([request.read(), request.read()]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
