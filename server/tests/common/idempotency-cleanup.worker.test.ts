import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteMany = vi.fn();

vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: { idempotencyKey: { deleteMany } },
}));

vi.mock("../../src/common/looger/logger.ts", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { purgeExpiredIdempotencyKeys } = await import(
  "../../src/common/worker/idempotency-cleanup.worker.ts"
);

describe("purgeExpiredIdempotencyKeys", () => {
  beforeEach(() => {
    deleteMany.mockReset();
  });

  it("deletes keys past their expiry and returns the count", async () => {
    deleteMany.mockResolvedValue({ count: 3 });
    const before = Date.now();

    const removed = await purgeExpiredIdempotencyKeys();

    expect(removed).toBe(3);
    expect(deleteMany).toHaveBeenCalledTimes(1);
    const where = deleteMany.mock.calls[0][0].where;
    expect(where.expiresAt.lt).toBeInstanceOf(Date);
    expect(where.expiresAt.lt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("returns 0 when nothing is expired", async () => {
    deleteMany.mockResolvedValue({ count: 0 });

    expect(await purgeExpiredIdempotencyKeys()).toBe(0);
  });
});
