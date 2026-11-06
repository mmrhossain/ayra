"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks/use-notifications";
import type {
  NotificationLevel,
  NotificationListResult,
} from "@/features/notifications/types";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<NotificationLevel, string> = {
  INFO: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300",
  SUCCESS:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  WARNING:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ERROR:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

export function NotificationsPage({
  initialData,
}: {
  initialData?: NotificationListResult;
}) {
  const { items, unreadCount, query } = useNotifications(50, initialData);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Bell className="size-5" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}.`
              : "You are all caught up."}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      {query.isLoading ? (
        <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading notifications…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No notifications yet. Order and account updates will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const level = item.level as NotificationLevel;
            const inner = (
              <>
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    LEVEL_STYLES[level] ?? LEVEL_STYLES.INFO,
                  )}
                >
                  {level}
                </span>
                <span
                  className={cn(
                    "mt-1.5 block text-sm",
                    item.read ? "font-medium" : "font-semibold",
                  )}
                >
                  {item.title}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {item.body}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground/80">
                  {formatNotificationTime(item.createdAt)}
                </span>
              </>
            );

            return (
              <li key={item.id}>
                <div
                  onClick={() => {
                    if (!item.read) markRead.mutate(item.id);
                  }}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    item.read
                      ? "bg-card"
                      : "border-primary/30 bg-primary/5",
                    item.href ? "cursor-pointer hover:bg-muted/60" : "",
                  )}
                >
                  {item.href ? (
                    <Link href={item.href} className="block">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
