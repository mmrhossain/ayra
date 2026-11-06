import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { env } from "../../src/config/env.ts";
import { checkoutLimiter } from "../../src/common/middleware/rate-limit.middleware.ts";

const app = express();
app.post("/checkout", checkoutLimiter, (_req, res) => {
  res.status(200).json({ success: true });
});

describe("Checkout rate limiter", () => {
  const originalNodeEnv = env.NODE_ENV;

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv;
  });

  it("rejects the sixth checkout attempt within a minute", async () => {
    env.NODE_ENV = "development";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const allowed = await request(app).post("/checkout").send({});
      expect(allowed.status).toBe(200);
    }

    const blocked = await request(app).post("/checkout").send({});

    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBe("60");
    expect(blocked.body.message).toMatch(/too many checkout requests/i);
  });
});
