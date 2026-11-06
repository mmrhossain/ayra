import { describe, expect, it } from "vitest";
import type { NextFunction, Request, Response } from "express";
import {
  MAX_CONCURRENT_UPLOAD_REQUESTS,
  MAX_CONCURRENT_UPLOAD_REQUESTS_PER_USER,
  uploadConcurrencyGuard,
} from "../../src/common/middleware/upload-concurrency.middleware.ts";

const startRequest = (userId = "anonymous") => {
  const listeners: Record<string, Array<() => void>> = { finish: [], close: [] };
  const res = {
    once: (event: string, cb: () => void) => {
      listeners[event]?.push(cb);
    },
    emit: (event: string) => {
      for (const cb of listeners[event] ?? []) cb();
    },
  } as unknown as Response & { emit: (event: string) => void };

  const req = { auth: { user: { id: userId } } } as unknown as Request;

  return new Promise<{ accepted: boolean; statusCode?: number; res: typeof res }>(
    (resolve) => {
      void uploadConcurrencyGuard(req, res, ((err?: unknown) => {
        if (err) {
          resolve({
            accepted: false,
            statusCode: (err as { statusCode?: number }).statusCode,
            res,
          });
          return;
        }
        resolve({ accepted: true, res });
      }) as NextFunction);
    }
  );
};

const releaseAll = (
  items: Array<{ res: { emit: (event: string) => void } }>
) => {
  for (const item of items) item.res.emit("finish");
};

describe("upload concurrency guard", () => {
  it("rejects a single user past their per-user cap", async () => {
    const inflight = [];
    for (let i = 0; i < MAX_CONCURRENT_UPLOAD_REQUESTS_PER_USER; i += 1) {
      inflight.push(await startRequest("user-a"));
    }

    const blocked = await startRequest("user-a");
    expect(blocked.accepted).toBe(false);
    expect(blocked.statusCode).toBe(429);

    inflight[0]?.res.emit("finish");
    const allowed = await startRequest("user-a");
    expect(allowed.accepted).toBe(true);

    releaseAll([...inflight.slice(1), allowed]);
  });

  it("lets one user upload while another is saturated (per-user isolation)", async () => {
    const saturated = [];
    for (let i = 0; i < MAX_CONCURRENT_UPLOAD_REQUESTS_PER_USER; i += 1) {
      saturated.push(await startRequest("busy-user"));
    }

    const other = await startRequest("idle-user");
    expect(other.accepted).toBe(true);

    releaseAll([...saturated, other]);
  });

  it("enforces a global cap across distinct users", async () => {
    const inflight = [];
    for (let i = 0; i < MAX_CONCURRENT_UPLOAD_REQUESTS; i += 1) {
      inflight.push(await startRequest(`user-${i}`));
    }

    const blocked = await startRequest("late-user");
    expect(blocked.accepted).toBe(false);
    expect(blocked.statusCode).toBe(429);

    inflight[0]?.res.emit("finish");
    const allowed = await startRequest("late-user");
    expect(allowed.accepted).toBe(true);

    releaseAll([...inflight.slice(1), allowed]);
  });
});
