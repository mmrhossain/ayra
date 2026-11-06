import { dashboardApi } from "@/lib/api/dashboard";
import type {
  Envelope,
  NotificationListParams,
  NotificationListResult,
} from "@/features/notifications/types";

export type {
  InAppNotification,
  NotificationLevel,
  NotificationListParams,
  NotificationListResult,
} from "@/features/notifications/types";

const noStore = { cache: "no-store" as const };

export async function fetchNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResult> {
  const res = await dashboardApi.get<Envelope<NotificationListResult>>(
    "/notifications",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        unreadOnly: params.unreadOnly ? "true" : undefined,
      },
    },
  );
  return res.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await dashboardApi.get<Envelope<{ unreadCount: number }>>(
    "/notifications/unread-count",
    noStore,
  );
  return res.data.unreadCount;
}

export async function markNotificationRead(id: string): Promise<void> {
  await dashboardApi.patch<Envelope<{ id: string; read: boolean }>>(
    `/notifications/${encodeURIComponent(id)}/read`,
  );
}

export async function markAllNotificationsRead(): Promise<number> {
  const res = await dashboardApi.patch<Envelope<{ updated: number }>>(
    "/notifications/read-all",
  );
  return res.data.updated;
}

export function toNotificationError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
