import type { Prisma } from "../../generated/prisma/client.ts";
import { logger } from "../../common/looger/logger.ts";
import { prisma } from "../../lib/prisma.ts";

/**
 * Explicit staff audit entries.
 *
 * The generic admin audit middleware only covers `/api/v1/admin/*`. Invitation
 * acceptance happens under `/api/v1/auth/*`, and Better Auth internal calls do
 * not pass through Express at all, so staff lifecycle changes record their own
 * events here. Tokens, passwords and cookies are never included.
 */
export async function recordStaffAudit(input: {
  actor: {
    id: string;
    email: string;
    role?: string | null;
  };
  action: string;
  entityId: string;
  outcome?: "SUCCESS" | "FAILURE";
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        actorRole:
          typeof input.actor.role === "string" ? input.actor.role : null,
        action: input.action,
        source: "STAFF",
        method: "INTERNAL",
        path: `staff/${input.entityId}`,
        statusCode: input.outcome === "FAILURE" ? 400 : 200,
        outcome: input.outcome ?? "SUCCESS",
        entityType: "staff",
        entityId: input.entityId,
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    });
  } catch (err) {
    logger.error({
      message: "Failed to record staff audit log",
      action: input.action,
      entityId: input.entityId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
