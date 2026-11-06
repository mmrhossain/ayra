import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "../../src/lib/prisma.ts";
import { pushInAppNotification } from "../../src/modules/notification/in-app.service.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

let counter = 0;
const suffix = () => `notif-${Date.now()}-${counter++}`;

describe("In-app notifications API", () => {
  it("lists only the caller's notifications newest first with unread count", async () => {
    const owner = await createTestUser(tracker, { suffix: suffix() });
    const other = await createTestUser(tracker, { suffix: suffix() });

    await pushInAppNotification({
      userId: owner.id,
      title: "Older",
      body: "first",
    });
    await new Promise((r) => setTimeout(r, 5));
    await pushInAppNotification({
      userId: owner.id,
      title: "Newer",
      body: "second",
      href: "/customer/orders",
    });
    await pushInAppNotification({
      userId: other.id,
      title: "Not yours",
      body: "hidden",
    });

    const res = await api()
      .get("/api/v1/notifications")
      .set("Cookie", owner.cookie);

    expect(res.status).toBe(200);
    const items = res.body.data.items as Array<{ title: string; href: string | null }>;
    expect(items.map((item) => item.title)).toEqual(["Newer", "Older"]);
    expect(items[0]?.href).toBe("/customer/orders");
    expect(res.body.data.unreadCount).toBe(2);
    expect(
      items.some((item) => item.title === "Not yours"),
    ).toBe(false);
  });

  it("exposes an unread count endpoint", async () => {
    const user = await createTestUser(tracker, { suffix: suffix() });
    await pushInAppNotification({ userId: user.id, title: "Hi", body: "There" });

    const res = await api()
      .get("/api/v1/notifications/unread-count")
      .set("Cookie", user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.unreadCount).toBe(1);
  });

  it("marks a single notification read and hides it from unread counts", async () => {
    const user = await createTestUser(tracker, { suffix: suffix() });
    await pushInAppNotification({ userId: user.id, title: "One", body: "a" });
    await pushInAppNotification({ userId: user.id, title: "Two", body: "b" });

    const list = await api()
      .get("/api/v1/notifications")
      .set("Cookie", user.cookie);
    const target = list.body.data.items[0].id as string;

    const marked = await api()
      .patch(`/api/v1/notifications/${target}/read`)
      .set("Cookie", user.cookie);

    expect(marked.status).toBe(200);
    expect(marked.body.data.read).toBe(true);

    const after = await api()
      .get("/api/v1/notifications/unread-count")
      .set("Cookie", user.cookie);
    expect(after.body.data.unreadCount).toBe(1);

    const stored = await prisma.notification.findUnique({
      where: { id: target },
      select: { status: true, readAt: true },
    });
    expect(stored?.status).toBe("READ");
    expect(stored?.readAt).not.toBeNull();
  });

  it("returns 404 when marking another user's notification read", async () => {
    const owner = await createTestUser(tracker, { suffix: suffix() });
    const other = await createTestUser(tracker, { suffix: suffix() });
    await pushInAppNotification({
      userId: owner.id,
      title: "Private",
      body: "secret",
    });

    const list = await api()
      .get("/api/v1/notifications")
      .set("Cookie", owner.cookie);
    const id = list.body.data.items[0].id as string;

    const res = await api()
      .patch(`/api/v1/notifications/${id}/read`)
      .set("Cookie", other.cookie);

    expect(res.status).toBe(404);
  });

  it("marks every notification as read", async () => {
    const user = await createTestUser(tracker, { suffix: suffix() });
    await pushInAppNotification({ userId: user.id, title: "A", body: "1" });
    await pushInAppNotification({ userId: user.id, title: "B", body: "2" });

    const res = await api()
      .patch("/api/v1/notifications/read-all")
      .set("Cookie", user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(2);

    const count = await api()
      .get("/api/v1/notifications/unread-count")
      .set("Cookie", user.cookie);
    expect(count.body.data.unreadCount).toBe(0);
  });

  it("requires authentication", async () => {
    const res = await api().get("/api/v1/notifications");
    expect(res.status).toBe(401);
  });
});
