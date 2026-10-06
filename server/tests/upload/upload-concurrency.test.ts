import { describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import {
  MAX_CONCURRENT_UPLOAD_REQUESTS,
  uploadConcurrencyGuard,
} from "../../src/common/middleware/upload-concurrency.middleware.ts";

const startRequest = () => {
  const listeners: Record<string, Array<() => void>> = { finish: [], close: [] };
  const res = {
    once: (event: string, cb: () => void) => {
      listeners[event]?.push(cb);
    },
    emit: (event: string) => {
      for (const cb of listeners[event] ?? []) cb();
    },
  } as unknown as Response & { emit: (event: string) => void };

  return new Promise<{ accepted: boolean; statusCode?: number; res: typeof res }>(
    (resolve) => {
      uploadConcurrencyGuard({} as Request, res, (err?: unknown) => {
        if (err) {
          resolve({
            accepted: false,
            statusCode: (err as { statusCode?: number }).statusCode,
            res,
          });
          return;
        }
        resolve({ accepted: true, res });
      });
    }
  );
};

describe("upload concurrency guard", () => {
  it("rejects when the in-flight upload cap is reached", async () => {
    const inflight = [];
    for (let i = 0; i < MAX_CONCURRENT_UPLOAD_REQUESTS; i += 1) {
      inflight.push(await startRequest());
    }

    const blocked = await startRequest();
    expect(blocked.accepted).toBe(false);
    expect(blocked.statusCode).toBe(429);

    inflight[0]?.res.emit("finish");
    const allowed = await startRequest();
    expect(allowed.accepted).toBe(true);

    for (const item of [...inflight.slice(1), allowed]) {
      item.res.emit("finish");
    }
  });
});
