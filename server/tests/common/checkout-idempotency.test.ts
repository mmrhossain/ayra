import type { Request, Response } from "express";
import { expect, it, vi } from "vitest";
import { checkoutIdempotency } from "../../src/common/middleware/idempotency.middleware.ts";

const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../../src/lib/prisma.ts", () => ({ prisma: { idempotencyKey: db } }));

function request(originalUrl: string, quantity = 1) {
  return {
    method: "POST",
    originalUrl,
    auth: { user: { id: "customer-a" } },
    header: () => "checkout-key",
    body: { quantity },
  } as unknown as Request;
}

it("replays the original checkout result for the same customer and key", async () => {
  db.findUnique.mockResolvedValueOnce(null);
  db.create.mockResolvedValueOnce({ id: "saved-request" });
  db.update.mockResolvedValueOnce({});
  let finish!: (body: unknown) => void;
  const sent = new Promise(resolve => { finish = resolve; });
  const first = { statusCode: 201, json: vi.fn(finish) } as unknown as Response;
  await checkoutIdempotency(request("/api/v1/checkout"), first, () => {
    first.json({ id: "order-a" });
  });
  await sent;
  const { requestHash } = db.create.mock.calls[0][0].data;
  db.findUnique.mockResolvedValue({
    requestHash,
    status: "COMPLETED",
    statusCode: 201,
    responseBody: { id: "order-a" },
  });
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const next = vi.fn();
  await checkoutIdempotency(request("/api/v1/checkout"), { status } as unknown as Response, next);
  expect(status).toHaveBeenCalledWith(201);
  expect(json).toHaveBeenCalledWith({ id: "order-a" });
  expect(next).not.toHaveBeenCalled();
  expect(db.findUnique.mock.calls[1][0].where.userId_scope_key).toEqual({
    userId: "customer-a", scope: "checkout", key: "checkout-key",
  });
  await expect(checkoutIdempotency(request("/api/v1/checkout", 2), {} as Response, next))
    .rejects.toMatchObject({ statusCode: 409 });
});
