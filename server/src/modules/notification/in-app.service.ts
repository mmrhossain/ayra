import { AppError } from "../../common/errors/AppError.ts";
import { logger } from "../../common/looger/logger.ts";
import { prisma } from "../../lib/prisma.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

export type InAppNotificationLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type InAppNotificationInput = {
  userId: string;
  title: string;
  body: string;
  href?: string | null;
  level?: InAppNotificationLevel;
  metadata?: Record<string, unknown>;
};

const RECIPIENT_PREFIX = "in-app:";

const recipientFor = (userId: string) => `${RECIPIENT_PREFIX}${userId}`;

/**
 * Creates an IN_APP notification that is immediately available to the user.
 * Email/SMS channels are handled separately by the queued worker; IN_APP rows
 * are never picked up by the worker because they are stored as SENT.
 */
export const pushInAppNotification = async (
  input: InAppNotificationInput,
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        channel: "IN_APP",
        status: "SENT",
        recipient: recipientFor(input.userId),
        subject: input.title,
        content: input.body,
        sentAt: new Date(),
        metadata: {
          href: input.href ?? null,
          level: input.level ?? "INFO",
          ...(input.metadata ?? {}),
        } as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    logger.error({
      msg: "Failed to create in-app notification",
      userId: input.userId,
      title: input.title,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

const inAppWhere = (userId: string) => ({
  userId,
  channel: "IN_APP" as const,
});

export const listInAppNotifications = async (input: {
  userId: string;
  page: number;
  limit: number;
  unreadOnly?: boolean;
}) => {
  const where = {
    ...inAppWhere(input.userId),
    ...(input.unreadOnly ? { readAt: null } : {}),
  };

  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        subject: true,
        content: true,
        metadata: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { ...inAppWhere(input.userId), readAt: null },
    }),
  ]);

  return {
    items: items.map((item) => {
      const metadata = (item.metadata ?? {}) as Record<string, unknown>;
      return {
        id: item.id,
        title: item.subject ?? "Notification",
        body: item.content,
        href: typeof metadata.href === "string" ? metadata.href : null,
        level:
          typeof metadata.level === "string" ? metadata.level : "INFO",
        read: item.readAt !== null,
        readAt: item.readAt,
        createdAt: item.createdAt,
      };
    }),
    unreadCount: unread,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    },
  };
};

export const getInAppUnreadCount = async (userId: string) =>
  prisma.notification.count({
    where: { ...inAppWhere(userId), readAt: null },
  });

export const markInAppNotificationRead = async (
  userId: string,
  id: string,
) => {
  const existing = await prisma.notification.findFirst({
    where: { id, ...inAppWhere(userId) },
    select: { id: true, readAt: true },
  });

  if (!existing) throw new AppError("Notification not found", 404);

  if (existing.readAt) return { id: existing.id, read: true };

  await prisma.notification.update({
    where: { id: existing.id },
    data: { readAt: new Date(), status: "READ" },
  });

  return { id: existing.id, read: true };
};

export const markAllInAppNotificationsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { ...inAppWhere(userId), readAt: null },
    data: { readAt: new Date(), status: "READ" },
  });

  return { updated: result.count };
};
