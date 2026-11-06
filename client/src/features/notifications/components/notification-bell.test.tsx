import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InAppNotification } from "@/features/notifications/types";

const markReadMutate = vi.fn();
const markAllMutate = vi.fn();

const notifications: InAppNotification[] = [
  {
    id: "n1",
    title: "New order ORD-1",
    body: "Ada placed an order.",
    href: "/admin/orders",
    level: "INFO",
    read: false,
    readAt: null,
    createdAt: new Date().toISOString(),
  },
];

let unreadCount = 1;

vi.mock("@/features/notifications/hooks/use-notifications", () => ({
  useNotifications: () => ({
    items: notifications,
    unreadCount,
    query: { isLoading: false },
  }),
  useMarkNotificationRead: () => ({ mutate: markReadMutate, isPending: false }),
  useMarkAllNotificationsRead: () => ({
    mutate: markAllMutate,
    isPending: false,
  }),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      [key: string]: unknown;
    }) => React.createElement("a", { href, ...rest }, children),
  };
});

import { NotificationBell } from "./notification-bell";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

describe("NotificationBell", () => {
  it("shows the unread badge and an accessible label", () => {
    act(() => root.render(<NotificationBell />));
    const trigger = container.querySelector("button");
    expect(trigger?.getAttribute("aria-label")).toBe(
      "Notifications, 1 unread",
    );
    expect(container.textContent).toContain("1");
  });

  it("renders no badge when everything is read", () => {
    unreadCount = 0;
    act(() => root.render(<NotificationBell />));
    expect(container.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Notifications",
    );
    unreadCount = 1;
  });
});
