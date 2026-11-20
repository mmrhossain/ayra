"use client";

import { notificationHref } from "@/features/notifications/utils/notification-href";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications/hooks/use-notifications";
import type { NotificationLevel } from "@/features/notifications/types";
import { cn } from "@/lib/utils";

const LEVEL_DOT: Record<NotificationLevel, string> = {
  INFO: "bg-sky-500",
  SUCCESS: "bg-emerald-500",
  WARNING: "bg-amber-500",
  ERROR: "bg-rose-500",
};

function timeAgo(value: string): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export function NotificationBell({
  className,
  badgeClassName,
  viewAllHref = "/customer/notifications",
}: {
  className?: string;
  badgeClassName?: string;
  viewAllHref?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { items, unreadCount: listUnreadCount, query } = useNotifications(10, undefined, open);
  const countQuery = useUnreadCount(!open);
  const unreadCount = open
    ? query.data?.unreadCount ?? countQuery.data ?? listUnreadCount
    : countQuery.data ?? listUnreadCount;
  const loadingCount = countQuery.data === undefined &&
    query.data === undefined &&
    (open ? query.isLoading : countQuery.isLoading);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={
            loadingCount
              ? "Notifications, loading unread count"
              : unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className={cn("relative", className)}
        >
          <Bell aria-hidden="true" className="size-4" />
          {loadingCount ? (
            <span aria-hidden="true" className={cn("absolute -right-1 -top-1 size-4 rounded-full bg-muted-foreground/25 motion-safe:animate-pulse", badgeClassName)} />
          ) : unreadCount > 0 ? (
            <span className={cn("absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-xs font-semibold leading-4 text-destructive-foreground", badgeClassName)}>
              {badge}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-80 max-w-[calc(100vw-1.5rem)] p-0 sm:w-96"
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <DropdownMenuItem
              className="min-h-7 gap-1 text-xs font-medium"
              disabled={markAll.isPending}
              onSelect={event => {
                event.preventDefault();
                markAll.mutate();
              }}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </DropdownMenuItem>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-[22rem] overflow-y-auto">
          {query.isLoading ? (
            <div role="status" aria-label="Loading notifications">
              <div aria-hidden="true" className="divide-y divide-border">
                {[0, 1, 2].map(row => (
                  <div key={row} className="flex items-start gap-2.5 px-3 py-3">
                    <Skeleton className="mt-1 size-2 shrink-0 rounded-full motion-reduce:animate-none" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3 motion-reduce:animate-none" />
                      <Skeleton className="h-3 w-full motion-reduce:animate-none" />
                      <Skeleton className="h-2 w-12 motion-reduce:animate-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            items.map((item) => {
              const level = item.level as NotificationLevel;
              const content = (
                <span className="flex w-full items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      item.read
                        ? "bg-border"
                        : (LEVEL_DOT[level] ?? "bg-sky-500"),
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        item.read ? "font-normal" : "font-semibold",
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                      {item.body}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground/80">
                      {timeAgo(item.createdAt)}
                    </span>
                  </span>
                </span>
              );

              return (
                <DropdownMenuItem
                  key={item.id}
                  className="items-start rounded-none px-3 py-2.5 focus:bg-muted/60"
                  onSelect={event => {
                    if (!item.href) event.preventDefault();
                    if (!item.read) markRead.mutate(item.id);
                  }}
                  asChild={Boolean(item.href)}
                >
                  {item.href ? (
                    <Link href={notificationHref(item.href)!}>{content}</Link>
                  ) : (
                    content
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          className="justify-center rounded-none py-2.5 text-xs font-medium"
          onSelect={() => setOpen(false)}
          asChild
        >
          <Link href={viewAllHref}>View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
