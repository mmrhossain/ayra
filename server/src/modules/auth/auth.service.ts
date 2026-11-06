import { AppError } from "../../common/errors/AppError.ts";
import { paginated } from "../../common/utils/paginate.ts";
import { normalizeRole } from "../../common/utils/roles.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma, transaction } from "../../lib/prisma.ts";
import { revokeUserSessions } from "../../lib/sessions.ts";
import type { AdminListUsersQuery, BanUserInput } from "./types.ts";

/**
 * Customer administration is implemented with Prisma directly instead of the
 * Better Auth admin endpoints. The plugin only checks the coarse `ADMIN` role,
 * which would let a scoped staff member manage arbitrary accounts. Better Auth
 * keeps owning credentials, sessions and identity; this module only manages the
 * customer-facing account state that the dashboard exposes.
 */

const toUserStatus = (user: {
  banned?: boolean | null | undefined;
  emailVerified?: boolean | null | undefined;
}): "ACTIVE" | "INACTIVE" | "BLOCKED" => {
  if (user.banned) return "BLOCKED";
  if (user.emailVerified === false) return "INACTIVE";
  return "ACTIVE";
};

const serializeAdminUser = (user: {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
  role?: string | null | undefined;
  banned?: boolean | null | undefined;
  banReason?: string | null | undefined;
  banExpires?: Date | string | null | undefined;
  emailVerified: boolean;
  createdAt: Date | string;
}) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: normalizeRole(user.role) ?? "CUSTOMER",
    status: toUserStatus(user),
    banned: user.banned ?? false,
    banReason: user.banReason ?? null,
    banExpires:
      user.banExpires instanceof Date ? user.banExpires.toISOString() : (user.banExpires ?? null),
    emailVerified: user.emailVerified,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  };
};

const statusWhere = (status?: "ACTIVE" | "INACTIVE" | "BLOCKED") => {
  if (status === "BLOCKED") return { banned: true };
  if (status === "INACTIVE") return { emailVerified: false, banned: { not: true } };
  if (status === "ACTIVE") return { emailVerified: true, banned: { not: true } };
  return {};
};

export const listUsers = async (query: AdminListUsersQuery) => {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(query.role === "CUSTOMER"
      ? { role: { equals: "customer", mode: "insensitive" as const } }
      : query.role
        ? { role: { equals: query.role, mode: "insensitive" as const } }
        : {}),
    ...statusWhere(query.status),
    ...(query.searchValue && query.searchField
      ? {
          [query.searchField]: {
            contains: query.searchValue,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: {
        [query.sortBy ?? "createdAt"]: query.sortDirection === "asc" ? "asc" : "desc",
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(
    users.map((user) => serializeAdminUser(user)),
    query.page,
    query.limit,
    total,
  );
};

export const getUser = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw new AppError("User not found", 404);
  return serializeAdminUser(user);
};

/**
 * Bans a *customer* account. Staff accounts are intentionally excluded: their
 * suspension/offboarding flows enforce the last-super-admin invariant and
 * revoke sessions atomically, whereas this endpoint is the customer abuse path.
 */
export const banUser = async (userId: string, input: BanUserInput) => {
  const user = await transaction(async (tx) => {
    const target = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!target) throw new AppError("User not found", 404);

    if (normalizeRole(target.role) === "ADMIN") {
      throw new AppError(
        "Use staff suspension or offboarding to disable a staff account",
        409,
        "STAFF_ACCOUNT",
      );
    }

    const banned = await tx.user.update({
      where: { id: target.id },
      data: {
        banned: true,
        banReason: input.banReason ?? null,
        banExpires: input.banExpiresIn
          ? new Date(Date.now() + input.banExpiresIn * 1000)
          : null,
      },
    });

    return banned;
  });

  await revokeUserSessions(user.id);
  return { user: serializeAdminUser(user) };
};

export const unbanUser = async (userId: string) => {
  const existing = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new AppError("User not found", 404);

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: { banned: false, banReason: null, banExpires: null },
  });

  return { user: serializeAdminUser(user) };
};
