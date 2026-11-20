import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ fail: false, resetSeconds: null as number | null, calls: [] as Array<{ prefix: string; key: string }> }));
vi.mock("../../src/config/env.ts", () => ({ env: { NODE_ENV: "development", RATE_LIMIT_WINDOW_MS: 60000, RATE_LIMIT_MAX_REQUESTS: 5, RATE_LIMIT_READ_WINDOW_MS: 60000, RATE_LIMIT_READ_MAX_REQUESTS: 10 } }));
vi.mock("../../src/lib/redis.ts", () => ({ redis: { call: vi.fn() } }));
vi.mock("../../src/common/looger/logger.ts", () => ({ logger: { warn: vi.fn() } }));
vi.mock("rate-limit-redis", async () => {
  const { MemoryStore } = await import("express-rate-limit");
  return { RedisStore: class extends MemoryStore {
    prefix: string;
    constructor({ prefix }: { prefix: string }) { super(); this.prefix = prefix; }
    async increment(key: string) {
      if (state.fail) throw new Error("Redis unavailable");
      state.calls.push({ prefix: this.prefix, key });
      const result = await super.increment(key);
      return state.resetSeconds === null ? result : { ...result, resetTime: new Date(Date.now() + state.resetSeconds * 1000) };
    }
  } };
});
import { authenticatedDomainLimiter, authLimiter, domainLimiter, identityKey, limiter } from "../../src/common/middleware/rate-limit.middleware.ts";
let testId = 0;
function app({ global = true, authentication = false } = {}) {
  const server = express();
  server.use((req, _res, next) => {
    Object.defineProperty(req, "ip", { value: "198.51.100." + testId });
    if (req.header("x-verified-user")) req.auth = { user: { id: req.header("x-verified-user")! } } as NonNullable<Request["auth"]>;
    next();
  });
  if (global) server.use(limiter, domainLimiter);
  server.use(authentication ? authLimiter : authenticatedDomainLimiter);
  server.use((req, res) => { res.status(req.header("x-reject") ? 401 : 200).json({ success: !req.header("x-reject") }); });
  server.use((error: { statusCode?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) => { res.status(error.statusCode ?? 500).json({ code: error.code }); });
  return server;
}
beforeEach(() => { testId += 1; state.fail = false; state.resetSeconds = null; state.calls.length = 0; });

describe("e-commerce rate limit policies", () => {
  it("does not use an unverified cookie as an identity", () => {
    const fake = (token: string) => ({ ip: "192.0.2.1", cookies: { "ayra.session_token": token } }) as unknown as Request;
    expect(identityKey(fake("a"))).toBe(identityKey(fake("b")));
    const verified = { ...fake("a"), auth: { user: { id: "verified-user" } } } as unknown as Request;
    expect(identityKey(verified)).toBe("verified-user");
  });
  it("keeps browsing reads separate from the write quota", async () => {
    const server = app();
    for (let i = 0; i < 10; i++) expect((await request(server).get("/api/v1/categories/women/saree")).status).toBe(200);
    expect((await request(server).get("/api/v1/settings/public")).status).toBe(429);
    expect((await request(server).post("/api/v1/test-write")).status).toBe(200);
  });
  it("keeps callback quotas separate from exhausted shopper limits", async () => {
    const server = app();
    for (let i = 0; i < 5; i++) await request(server).post("/api/v1/test-write");
    expect((await request(server).post("/api/v1/test-write")).status).toBe(429);
    expect((await request(server).post("/api/v1/payments/sslcommerz/ipn")).status).toBe(200);
    expect((await request(server).post("/api/v1/payments/sslcommerz/unknown")).status).toBe(429);
    expect(state.calls.some(call => call.prefix === "gateway:rl:")).toBe(true);
  });
  it("uses a bounded memory fallback for browsing when Redis fails", async () => {
    state.fail = true; const server = app();
    for (let i = 0; i < 10; i++) expect((await request(server).get("/api/v1/settings/public")).status).toBe(200);
    expect((await request(server).get("/api/v1/settings/public")).status).toBe(429);
  });
  it("keeps sensitive writes closed with a retryable 503 on Redis failure", async () => {
    state.fail = true; const response = await request(app()).post("/api/v1/test-write");
    expect(response.status).toBe(503); expect(response.body.code).toBe("RATE_LIMIT_UNAVAILABLE"); expect(response.headers["retry-after"]).toBe("5");
  });
  it("keeps callbacks bounded and available through the outage fallback", async () => {
    state.fail = true; expect((await request(app()).post("/api/v1/payments/sslcommerz/ipn")).status).toBe(200);
  });
  it("uses verified user IDs and independent cart read/write counters", async () => {
    const server = app({ global: false }); const user = "customer-" + testId;
    await request(server).get("/api/v1/cart").set("x-verified-user", user).set("Cookie", "ayra.session_token=a");
    await request(server).post("/api/v1/cart/items").set("x-verified-user", user).set("Cookie", "ayra.session_token=b");
    expect(state.calls).toEqual([{ prefix: "cart:read:rl:", key: user }, { prefix: "cart:rl:", key: user }]);
  });
  it("separates admin reads from writes under the same verified identity", async () => {
    const server = app({ global: false }); const user = "admin-" + testId;
    await request(server).get("/api/v1/admin/overview").set("x-verified-user", user);
    await request(server).patch("/api/v1/admin/products/one").set("x-verified-user", user);
    expect(state.calls).toEqual([{ prefix: "admin:read:rl:", key: user }, { prefix: "admin:rl:", key: user }]);
  });
  it("does not apply authenticated policies before identity verification", async () => {
    await request(app({ global: false })).post("/api/v1/cart/items").set("Cookie", "ayra.session_token=forged");
    expect(state.calls).toHaveLength(0);
  });
  it("reports the remaining reset time rather than the whole window", async () => {
    state.resetSeconds = 2; const server = app();
    for (let i = 0; i < 5; i++) await request(server).post("/api/v1/test-write");
    const blocked = await request(server).post("/api/v1/test-write");
    expect(blocked.status).toBe(429); expect(Number(blocked.headers["retry-after"])).toBeLessThanOrEqual(2);
  });
  it("does not exhaust the failed-login budget on successful authentication", async () => {
    const server = app({ global: false, authentication: true });
    for (let i = 0; i < 25; i++) expect((await request(server).post("/api/v1/auth/sign-in/email")).status).toBe(200);
    for (let i = 0; i < 20; i++) expect((await request(server).post("/api/v1/auth/sign-in/email").set("x-reject", "1")).status).toBe(401);
    expect((await request(server).post("/api/v1/auth/sign-in/email").set("x-reject", "1")).status).toBe(429);
  });
});
