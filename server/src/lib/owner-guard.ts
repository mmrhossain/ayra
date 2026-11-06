import { AppError } from "../common/errors/AppError.ts";
import type { TransactionClient } from "./prisma.ts";

/**
 * Serializes all operations that can remove the last privileged administrator.
 *
 * A plain `SELECT count(*)` before an update is racy: two concurrent requests
 * can both observe two active super admins, then each remove one. Every guard
 * therefore takes a transaction-scoped advisory lock before counting, and the
 * caller keeps the surrounding transaction open until the mutation commits.
 */
// Must stay byte-for-byte identical to the key used by the
// "user_last_super_admin_guard" trigger in
// prisma/migrations/20261102022000_owner_guard_trigger. Use a BigInt literal:
// as a JS number this value exceeds Number.MAX_SAFE_INTEGER and silently
// rounds to a different lock key, so the two guards would not serialize.
export const OWNER_GUARD_LOCK_KEY = 4706773726645583461n;

export const lockOwnerGuard = async (tx: TransactionClient): Promise<void> => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${OWNER_GUARD_LOCK_KEY}::bigint)`;
};

const activeSuperAdminWhere = {
  role: { equals: "admin", mode: "insensitive" as const },
  isSuperAdmin: true,
  staffStatus: "ACTIVE" as const,
  banned: { not: true },
  deletedAt: null,
};

export async function countActiveSuperAdmins(
  tx: TransactionClient,
  excludeUserId?: string,
): Promise<number> {
  return tx.user.count({
    where: {
      ...activeSuperAdminWhere,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

/**
 * Counts the other active super admins using the global Prisma client. Used by
 * Better Auth hooks that do not expose a transaction handle; the database
 * trigger remains the authoritative guard for those paths.
 */
export async function countActiveSuperAdminsById(
  excludeUserId: string,
): Promise<number> {
  const { prisma } = await import("./prisma.ts");
  return prisma.user.count({
    where: {
      ...activeSuperAdminWhere,
      id: { not: excludeUserId },
    },
  });
}

/**
 * Throws unless at least one *other* active super admin remains.
 *
 * Must be called inside a transaction that already holds the owner guard lock.
 */
export async function assertOwnerRemains(
  tx: TransactionClient,
  targetUserId: string,
): Promise<void> {
  const remaining = await countActiveSuperAdmins(tx, targetUserId);
  if (remaining === 0) {
    throw new AppError(
      "At least one active super admin must remain",
      409,
      "LAST_SUPER_ADMIN",
    );
  }
}

/**
 * Applies a mutation while holding the owner guard lock. Use this for any path
 * that demotes, suspends, bans, offboards, deletes or de-privileges a staff
 * account.
 */
export async function withOwnerGuard<T>(
  prismaClient: {
    $transaction: <R>(
      fn: (tx: TransactionClient) => Promise<R>,
    ) => Promise<R>;
  },
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return prismaClient.$transaction(async (tx) => {
    await lockOwnerGuard(tx);
    return fn(tx);
  });
}
