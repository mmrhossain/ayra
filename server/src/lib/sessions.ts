import { logger } from "../common/looger/logger.ts";
import { auth } from "./auth.ts";

/**
 * Revokes every session for a user.
 *
 * Authorization no longer depends on the cached session snapshot (see
 * `requireAuth`), so this is defence in depth: the stale cookie is destroyed
 * for the client as well. Failures are logged and surfaced to the caller so a
 * partially applied privilege change is visible rather than silently ignored.
 */
export async function revokeUserSessions(userId: string): Promise<boolean> {
  try {
    const context = await auth.$context;
    await context.internalAdapter.deleteUserSessions(userId);
    return true;
  } catch (err) {
    logger.error({
      message: "Failed to revoke user sessions",
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function revokeAllSessionsFor(userIds: string[]): Promise<void> {
  await Promise.all(userIds.map((id) => revokeUserSessions(id)));
}
