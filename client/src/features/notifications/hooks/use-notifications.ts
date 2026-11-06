"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListResult,
} from "@/features/notifications/api/notifications";

const POLL_INTERVAL_MS = 60_000;

export function useNotifications(limit = 10, initialData?: NotificationListResult) {
  const query = useQuery({
    queryKey: ["notifications", limit],
    queryFn: () => fetchNotifications({ page: 1, limit }),
    initialData: initialData
      ? { ...initialData, items: initialData.items.slice(0, limit) }
      : undefined,
    staleTime: 30_000,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  return {
    query,
    data: query.data,
    items: query.data?.items ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
  };
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
