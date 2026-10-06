import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/gemini.ts", () => ({
  GEMINI_MODEL: "gemini-test",
  getGemini: () => null,
}));

import { redis } from "../../src/lib/redis.ts";
import { api } from "../helpers/index.ts";

const flushAiRateLimit = async () => {
  if (!redis) return;
  const keys = await redis.keys("ai:rl:*");
  if (keys.length) await redis.del(...keys);
};

afterEach(async () => {
  await flushAiRateLimit();
});

describe("AI chat", () => {
  it("allows guest access without auth", async () => {
    await flushAiRateLimit();
    const res = await api().post("/api/v1/ai/chat").send({ message: "hello" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBeTruthy();
  });

  it("rejects empty or oversize messages", async () => {
    await flushAiRateLimit();
    const empty = await api().post("/api/v1/ai/chat").send({ message: "   " });
    expect(empty.status).toBe(400);

    const tooLong = await api()
      .post("/api/v1/ai/chat")
      .send({ message: "x".repeat(501) });
    expect(tooLong.status).toBe(400);
  });

  it("returns 429 after the rate limit is exceeded", async () => {
    await flushAiRateLimit();
    const statuses: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      const res = await api()
        .post("/api/v1/ai/chat")
        .send({ message: `ping ${i}` });
      statuses.push(res.status);
    }
    expect(statuses.some((s) => s === 429)).toBe(true);
  });
});
