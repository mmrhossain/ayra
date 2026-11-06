"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
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
  viewAllHref = "/customer/notifications",
}: {
  className?: string;
  viewAllHref?: string;
}) {
  const { items, unreadCount, query } = useNotifications(10);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [open, setOpen] = React.useState(false);

  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className={cn("relative", className)}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-xs font-semibold leading-4 text-destructive-foreground">
              {badge}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="gap-1 text-xs font-medium"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-[22rem] overflow-y-auto">
          {query.isLoading ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Loading notifications…
            </p>
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
                  onSelect={() => {
                    if (!item.read) markRead.mutate(item.id);
                    setOpen(false);
                  }}
                  asChild={Boolean(item.href)}
                >
                  {item.href ? (
                    <Link href={item.href}>{content}</Link>
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
