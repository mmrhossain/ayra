import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ options: null as null | { retryStrategy: (attempt: number) => number; maxRetriesPerRequest: number } }));
vi.mock("../../src/config/env.ts", () => ({ env: { REDIS_URL: "redis://localhost:6379", NODE_ENV: "test" } }));
vi.mock("../../src/common/looger/logger.ts", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("ioredis", () => ({ Redis: class {
  constructor(_url: string, options: NonNullable<typeof mocked.options>) { mocked.options = options; }
  on() { return this; }
} }));

import "../../src/lib/redis.ts";

describe("Redis outage recovery", () => {
  it("continues reconnecting beyond three failures with capped backoff", () => {
    const retry = mocked.options!.retryStrategy;
    expect([1, 2, 3, 4, 10, 100, 10000].map(retry)).toEqual([500, 1000, 2000, 4000, 4000, 4000, 4000]);
  });
  it("keeps per-request retries bounded during an outage", () => {
    expect(mocked.options!.maxRetriesPerRequest).toBe(1);
  });
});
