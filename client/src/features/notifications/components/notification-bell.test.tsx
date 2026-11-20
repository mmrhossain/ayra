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

let unreadCount: number | undefined = 1;
let includeLink = true;

vi.mock("@/features/notifications/hooks/use-notifications", () => ({
  useUnreadCount: () => ({ data: unreadCount, isLoading: unreadCount === undefined }),
  useNotifications: () => ({
    items: includeLink ? notifications : notifications.map(item => ({ ...item, href: null })),
    unreadCount: unreadCount ?? 0,
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
  unreadCount = 1;
  includeLink = true;
});

describe("NotificationBell", () => {
  it("opens without locking page scroll or hiding the navbar", async () => {
    await act(async () => root.render(<NotificationBell />));
    const trigger = container.querySelector("button")!;
    await act(async () => {
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);
    expect(document.body.style.pointerEvents).not.toBe("none");
    expect(container.getAttribute("aria-hidden")).not.toBe("true");
    await act(async () => {
      document.querySelector('[role="menu"]')!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the menu open when marking notifications read", async () => {
    includeLink = false;
    await act(async () => root.render(<NotificationBell />));
    const trigger = container.querySelector("button")!;
    await act(async () => {
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const menuItem = (label: string) =>
      Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
        .find(item => item.textContent?.includes(label));
    await act(async () => menuItem("New order ORD-1")!.click());
    expect(markReadMutate).toHaveBeenCalledWith("n1");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await act(async () => menuItem("Mark all read")!.click());
    expect(markAllMutate).toHaveBeenCalledTimes(1);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
  it("keeps the bell mounted while only its count badge loads", () => {
    unreadCount = undefined;
    act(() => root.render(<NotificationBell />));
    const trigger = container.querySelector("button");
    expect(trigger?.querySelector("svg")).not.toBeNull();
    expect(trigger?.getAttribute("aria-label")).toBe("Notifications, loading unread count");
    expect(trigger?.querySelector("span[aria-hidden]")).not.toBeNull();

    unreadCount = 3;
    act(() => root.render(<NotificationBell />));
    expect(container.querySelector("button")).toBe(trigger);
    expect(trigger?.getAttribute("aria-label")).toBe("Notifications, 3 unread");
    expect(trigger?.textContent).toContain("3");
  });
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
