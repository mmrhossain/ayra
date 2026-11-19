import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  fetchNotifications: vi.fn(async () => ({ items: [], unreadCount: 1 })),
  fetchUnreadCount: vi.fn(async () => 2),
}));
vi.mock("@/features/notifications/api/notifications", () => ({
  ...api,
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));
import { useNotifications, useUnreadCount } from "./use-notifications";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
function BellQueries() {
  const [open, setOpen] = useState(false);
  const list = useNotifications(10, undefined, open);
  const count = useUnreadCount(!open);
  return <button onClick={() => setOpen(value => !value)}>
    {open ? list.unreadCount : count.data}
  </button>;
}
function NotificationPageQuery() {
  useNotifications(50);
  return null;
}
const settle = () => act(async () => {
  await new Promise(resolve => setTimeout(resolve, 20));
});
beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  client.clear();
  container.remove();
});
describe("notification query loading", () => {
  it("loads only the unread count until opened, then loads the list", async () => {
    act(() => root.render(<QueryClientProvider client={client}><BellQueries /></QueryClientProvider>));
    await settle();
    expect(api.fetchUnreadCount).toHaveBeenCalledTimes(1);
    expect(api.fetchNotifications).not.toHaveBeenCalled();
    expect(container.textContent).toBe("2");
    act(() => container.querySelector("button")!.click());
    await settle();
    expect(api.fetchNotifications).toHaveBeenCalledExactlyOnceWith({ page: 1, limit: 10 });
    expect(container.textContent).toBe("1");
  });
  it("keeps notification pages loading immediately by default", async () => {
    act(() => root.render(<QueryClientProvider client={client}><NotificationPageQuery /></QueryClientProvider>));
    await settle();
    expect(api.fetchNotifications).toHaveBeenCalledExactlyOnceWith({ page: 1, limit: 50 });
  });
});
