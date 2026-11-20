import { beforeEach, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ notification: { findMany: vi.fn(), count: vi.fn() } }));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: db }));
vi.mock("../../src/common/looger/logger.ts", () => ({ logger: { error: vi.fn() } }));
import { listInAppNotifications } from "../../src/modules/notification/in-app.service.ts";
beforeEach(() => { vi.resetAllMocks(); db.notification.findMany.mockResolvedValue([]); });
it("executes the unread count once even with Prisma's lazy thenable behavior", async () => {
  const execute = vi.fn().mockResolvedValue(7);
  db.notification.count.mockReturnValue({ then: (resolve: (n: number) => unknown) => execute().then(resolve) });
  const result = await listInAppNotifications({ userId: "owner", page: 1, limit: 10, unreadOnly: true });
  expect(db.notification.count).toHaveBeenCalledOnce();
  expect(execute).toHaveBeenCalledOnce();
  expect(result.unreadCount).toBe(7); expect(result.pagination.total).toBe(7);
  expect(db.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "owner", channel: "IN_APP", readAt: null } }));
});
it("keeps distinct total and unread counts for the full list", async () => {
  db.notification.count.mockImplementation(({ where }: { where: { readAt?: null } }) => Promise.resolve(where.readAt === null ? 3 : 12));
  const result = await listInAppNotifications({ userId: "owner", page: 2, limit: 10 });
  expect(db.notification.count).toHaveBeenCalledTimes(2); expect(result.unreadCount).toBe(3); expect(result.pagination.total).toBe(12);
  expect(db.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10, where: { userId: "owner", channel: "IN_APP" } }));
});
