import { paginated } from "../../common/utils/paginate.ts";
import { prisma } from "../../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import type {
  CreateAdminAuditLogInput,
  ListAdminAuditLogsQuery,
} from "./types.ts";

export type AuditLogFilters = Omit<ListAdminAuditLogsQuery, "page" | "limit">;

const MAX_EXPORT_ROWS = 10_000;

export async function recordAdminAudit(
  input: CreateAdminAuditLogInput,
): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action ?? null,
      source: input.source ?? "APP",
      method: input.method.toUpperCase(),
      path: input.path,
      statusCode: input.statusCode,
      outcome: input.outcome ?? (input.statusCode >= 400 ? "FAILURE" : "SUCCESS"),
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
      durationMs: input.durationMs ?? null,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    },
  });
}

export function buildAuditLogWhere(
  query: AuditLogFilters,
): Prisma.AdminAuditLogWhereInput {
  return {
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(query.actorEmail
      ? { actorEmail: { contains: query.actorEmail, mode: "insensitive" } }
      : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.method ? { method: query.method.toUpperCase() } : {}),
    ...(query.status !== undefined ? { statusCode: query.status } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.source ? { source: query.source.toUpperCase() } : {}),
    ...(query.outcome ? { outcome: query.outcome } : {}),
    ...(query.search
      ? {
          OR: [
            { path: { contains: query.search, mode: "insensitive" } },
            { action: { contains: query.search, mode: "insensitive" } },
            { entityId: { contains: query.search, mode: "insensitive" } },
            { requestId: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
  };
}

export async function listAdminAuditLogs(query: ListAdminAuditLogsQuery) {
  const where = buildAuditLogWhere(query);

  const [items, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return paginated(items, query.page, query.limit, total);
}

export async function exportAdminAuditLogs(filters: AuditLogFilters) {
  const rows = await prisma.adminAuditLog.findMany({
    where: buildAuditLogWhere(filters),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_EXPORT_ROWS,
  });

  return rows;
}

export { MAX_EXPORT_ROWS };
