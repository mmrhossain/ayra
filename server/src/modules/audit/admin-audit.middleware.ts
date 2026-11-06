import type { NextFunction, Request, Response } from "express";
import { logger } from "../../common/looger/logger.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import { recordAdminAudit } from "./admin-audit.service.ts";
import {
  deriveAuditAction,
  parseAuditTarget,
  redactAuditPayload,
  shouldAuditMethod,
} from "./admin-audit.utils.ts";

/**
 * Staff lifecycle routes record their own, richer audit entries through
 * `recordStaffAudit` (actor, action, outcome, before/after access). Skipping
 * the generic middleware here prevents duplicate events for the same change.
 */
const SELF_AUDITED_PATH = /^\/api\/v1\/admin\/staff(\/|$)/;

export function adminAuditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    !shouldAuditMethod(req.method) ||
    SELF_AUDITED_PATH.test(req.originalUrl ?? req.path)
  ) {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const target = parseAuditTarget(req.originalUrl ?? req.path);
    const actor = req.auth?.user;
    const durationMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);

    void recordAdminAudit({
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: typeof actor?.role === "string" ? actor.role : null,
      action: deriveAuditAction(req.method, target),
      source: "APP",
      method: req.method,
      path: target.path,
      statusCode: res.statusCode,
      outcome: res.statusCode >= 400 ? "FAILURE" : "SUCCESS",
      entityType: target.entityType ?? null,
      entityId: target.entityId ?? null,
      ip: req.ip ?? null,
      userAgent: req.header("user-agent")?.slice(0, 512) ?? null,
      requestId: req.requestId ?? null,
      durationMs: Number.isFinite(durationMs) ? durationMs : null,
      metadata: {
        query: redactAuditPayload(req.query),
        body: redactAuditPayload(req.body),
      } as Prisma.InputJsonValue,
    }).catch((error: unknown) => {
      logger.error("Failed to record admin audit log", {
        error: error instanceof Error ? error.message : String(error),
        method: req.method,
        path: target.path,
      });
    });
  });

  next();
}
