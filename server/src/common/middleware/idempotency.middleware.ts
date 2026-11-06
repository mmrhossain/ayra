import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { isPrismaCode } from "../utils/prisma-error.ts";
import { prisma } from "../../lib/prisma.ts";
import { Prisma } from "../../generated/prisma/client.ts";

const TTL_MS = 24 * 60 * 60 * 1000;

const fingerprint = (req: Request): string =>
  createHash("sha256")
    .update(`${req.method}:${req.originalUrl}:${JSON.stringify(req.body ?? {})}`)
    .digest("hex");

/**
 * Makes a write endpoint idempotent when the caller sends an `Idempotency-Key`
 * header. The first request runs normally and its response is stored; later
 * requests with the same key (scoped to the user + operation) replay that
 * response instead of running the handler again. Reusing a key with a different
 * payload is rejected with 409, and a key already in flight is rejected too.
 *
 * Must be mounted after auth so `req.auth.user.id` is available.
 */
export const idempotency =
  (scope: string) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.header("Idempotency-Key")?.trim();
    if (!key || !req.auth) {
      next();
      return;
    }

    const userId = req.auth.user.id;
    const requestHash = fingerprint(req);
    const where = { userId_scope_key: { userId, scope, key } };
    const expiresAt = new Date(Date.now() + TTL_MS);

    const existing = await prisma.idempotencyKey.findUnique({ where });

    let recordId: string;

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new AppError(
          "Idempotency-Key was reused with a different request",
          409
        );
      }
      if (existing.status === "COMPLETED" && existing.statusCode != null) {
        res.status(existing.statusCode).json(existing.responseBody);
        return;
      }
      if (existing.expiresAt.getTime() > Date.now()) {
        throw new AppError(
          "A request with this Idempotency-Key is already in progress",
          409
        );
      }
      // Expired in-progress record: take it over.
      await prisma.idempotencyKey.update({
        where: { id: existing.id },
        data: { requestHash, status: "IN_PROGRESS", statusCode: null, expiresAt },
      });
      recordId = existing.id;
    } else {
      try {
        const created = await prisma.idempotencyKey.create({
          data: {
            key,
            scope,
            userId,
            requestHash,
            status: "IN_PROGRESS",
            expiresAt,
          },
        });
        recordId = created.id;
      } catch (err) {
        // Lost a race with a concurrent request using the same key.
        if (isPrismaCode(err, "P2002")) {
          throw new AppError(
            "A request with this Idempotency-Key is already in progress",
            409
          );
        }
        throw err;
      }
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Persist the outcome before the response leaves the process. Otherwise a
      // retry that arrives right after this response would still see
      // IN_PROGRESS and be rejected with a spurious 409.
      const persist =
        res.statusCode < 500
          ? prisma.idempotencyKey.update({
              where: { id: recordId },
              data: {
                status: "COMPLETED",
                statusCode: res.statusCode,
                responseBody: body as Prisma.InputJsonValue,
              },
            })
          : // 5xx: drop the record so a retry with the same key can run again.
            prisma.idempotencyKey.delete({ where: { id: recordId } });
      void persist
        .catch(() => undefined)
        .finally(() => originalJson(body));
      return res;
    };

    next();
  };
