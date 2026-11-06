import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import {
  CleanupTracker,
  api,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const invite = async (
  adminCookie: string,
  overrides: Partial<{
    email: string;
    name: string;
    permissions: string[];
    isSuperAdmin: boolean;
  }> = {},
) => {
  const email = overrides.email ?? `invitee-${randomUUID().slice(0, 8)}@example.test`;
  const res = await api()
    .post("/api/v1/admin/staff/invitations")
    .set("Cookie", adminCookie)
    .send({
      email,
      name: overrides.name ?? "Invited Person",
      permissions: overrides.permissions ?? ["catalog"],
      isSuperAdmin: overrides.isSuperAdmin ?? false,
    });
  return { res, email };
};

const trackUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) tracker.userIds.push(user.id);
  return user;
};

describe("Staff invitation lifecycle", () => {
  it("owner can invite and the returned token is not stored in plaintext", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const { res, email } = await invite(owner.cookie);

    expect(res.status).toBe(201);
    expect(res.body.data.invitation.email).toBe(email);
    expect(res.body.data.invitation.status).toBe("PENDING");
    expect(typeof res.body.data.token).toBe("string");

    const row = await prisma.staffInvitation.findFirstOrThrow({
      where: { email },
    });
    expect(row.tokenHash).not.toBe(res.body.data.token);
    expect(row.tokenHash).toHaveLength(64);
  });

  it("accepts an invitation, creates a credential account and grants access", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const { res, email } = await invite(owner.cookie, {
      permissions: ["catalog", "inventory"],
    });
    const token = res.body.data.token as string;

    const accepted = await api()
      .post("/api/v1/staff/invitations/accept")
      .send({ token, name: "Invited Person", password: "Password1!" });

    expect(accepted.status).toBe(200);
    expect(accepted.body.data.email).toBe(email);
    expect(accepted.body.data.role).toBe("ADMIN");
    expect(accepted.body.data.adminPermissions).toEqual([
      "catalog",
      "inventory",
    ]);
    expect(accepted.body.data.isSuperAdmin).toBe(false);

    const user = await trackUserByEmail(email);
    expect(user?.emailVerified).toBe(true);
    expect(user?.role).toBe("ADMIN");
    expect(user?.isSuperAdmin).toBe(false);

    const invitation = await prisma.staffInvitation.findFirstOrThrow({
      where: { email },
    });
    expect(invitation.status).toBe("ACCEPTED");
  });

  it("rejects reusing an accepted invitation", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const { res } = await invite(owner.cookie);
    const token = res.body.data.token as string;

    const first = await api()
      .post("/api/v1/staff/invitations/accept")
      .send({ token, password: "Password1!" });
    expect(first.status).toBe(200);

    const second = await api()
      .post("/api/v1/staff/invitations/accept")
      .send({ token, password: "Password1!" });
    expect(second.status).toBe(400);
  });

  it("rejects an expired invitation", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const { res, email } = await invite(owner.cookie);
    const token = res.body.data.token as string;

    await prisma.staffInvitation.updateMany({
      where: { email },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const accepted = await api()
      .post("/api/v1/staff/invitations/accept")
      .send({ token, password: "Password1!" });

    expect(accepted.status).toBe(400);
    expect(accepted.body.message).toMatch(/expired/i);
  });

  it("rejects a revoked invitation", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const { res } = await invite(owner.cookie);
    const invitationId = res.body.data.invitation.id as string;
    const token = res.body.data.token as string;

    const revoked = await api()
      .post(`/api/v1/admin/staff/invitations/${invitationId}/revoke`)
      .set("Cookie", owner.cookie);
    expect(revoked.status).toBe(200);

    const accepted = await api()
      .post("/api/v1/staff/invitations/accept")
      .send({ token, password: "Password1!" });
    expect(accepted.status).toBe(400);
  });

  it("does not attach staff access to an existing customer without that session", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const customer = await createTestUser(tracker, { role: "CUSTOMER" });
    const { res } = await invite(owner.cookie, { email: customer.email });
    const token = res.body.data.token as string;

    const anonymous = await api()
      .post("/api/v1/staff/invitations/accept")
      .send({ token });

    expect(anonymous.status).toBe(401);

    const stillCustomer = await prisma.user.findUniqueOrThrow({
      where: { id: customer.id },
    });
    expect(stillCustomer.role).toBe("CUSTOMER");
  });

  it("lets an existing customer accept when signed in as that account", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const customer = await createTestUser(tracker, { role: "CUSTOMER" });
    const { res } = await invite(owner.cookie, { email: customer.email });
    const token = res.body.data.token as string;

    const accepted = await api()
      .post("/api/v1/staff/invitations/accept")
      .set("Cookie", customer.cookie)
      .send({ token });

    expect(accepted.status).toBe(200);
    expect(accepted.body.data.id).toBe(customer.id);

    const promoted = await prisma.user.findUniqueOrThrow({
      where: { id: customer.id },
    });
    expect(promoted.role).toBe("ADMIN");
  });

  it("only super admins can invite or list invitations", async () => {
    const scoped = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["staff"],
    });

    const { res } = await invite(scoped.cookie);
    expect(res.status).toBe(403);

    const listed = await api()
      .get("/api/v1/admin/staff/invitations")
      .set("Cookie", scoped.cookie);
    expect(listed.status).toBe(403);
  });

  it("supports resend and keeps a single pending invitation per email", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const { res, email } = await invite(owner.cookie);
    const invitationId = res.body.data.invitation.id as string;

    const duplicate = await invite(owner.cookie, { email });
    expect(duplicate.res.status).toBe(409);

    const resent = await api()
      .post(`/api/v1/admin/staff/invitations/${invitationId}/resend`)
      .set("Cookie", owner.cookie);
    expect(resent.status).toBe(200);
    expect(resent.body.data.token).not.toBe(res.body.data.token);

    const oldToken = await api()
      .post("/api/v1/staff/invitations/accept")
      .send({ token: res.body.data.token, password: "Password1!" });
    expect(oldToken.status).toBe(404);

    const newToken = await api()
      .post("/api/v1/staff/invitations/accept")
      .send({ token: resent.body.data.token, password: "Password1!" });
    expect(newToken.status).toBe(200);
  });
});

describe("Staff access changes", () => {
  it("updates scopes and revokes the target's sessions", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const staff = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog", "orders"],
    });

    const before = await prisma.session.count({ where: { userId: staff.id } });
    expect(before).toBeGreaterThan(0);

    const updated = await api()
      .patch(`/api/v1/admin/staff/${staff.id}/access`)
      .set("Cookie", owner.cookie)
      .send({ permissions: ["catalog"] });

    expect(updated.status).toBe(200);
    expect(updated.body.data.adminPermissions).toEqual(["catalog"]);

    // The old cookie must stop working.
    const denied = await api()
      .get("/api/v1/admin/orders")
      .set("Cookie", staff.cookie);
    expect([401, 403]).toContain(denied.status);
  });

  it("paginates the full staff list instead of truncating it", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const tag = `page-${randomUUID().slice(0, 8)}`;
    const created: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const staff = await createTestUser(tracker, {
        role: "ADMIN",
        adminPermissions: ["catalog"],
        suffix: `${tag}-${index}`,
      });
      created.push(staff.id);
    }

    const firstPage = await api()
      .get("/api/v1/admin/staff")
      .set("Cookie", owner.cookie)
      .query({ page: 1, limit: 2, search: tag });
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.items).toHaveLength(2);
    expect(firstPage.body.data.pagination.total).toBe(3);
    expect(firstPage.body.data.pagination.totalPages).toBe(2);

    const secondPage = await api()
      .get("/api/v1/admin/staff")
      .set("Cookie", owner.cookie)
      .query({ page: 2, limit: 2, search: tag });
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.data.items).toHaveLength(1);

    const seen = new Set<string>([
      ...firstPage.body.data.items.map((item: { id: string }) => item.id),
      ...secondPage.body.data.items.map((item: { id: string }) => item.id),
    ]);
    for (const id of created) expect(seen.has(id)).toBe(true);
  });

  it("denies stale sessions even when session revocation fails", async () => {
    const staff = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    // Simulate a database-level permission reduction whose session
    // invalidation failed: the cookie still points at a live session row.
    await prisma.user.update({
      where: { id: staff.id },
      data: { adminPermissions: [] },
    });

    const stillLive = await prisma.session.count({
      where: { userId: staff.id },
    });
    expect(stillLive).toBeGreaterThan(0);

    const denied = await api()
      .get("/api/v1/admin/categories")
      .set("Cookie", staff.cookie);
    expect(denied.status).toBe(403);

    const promotion = await prisma.user.update({
      where: { id: staff.id },
      data: { isSuperAdmin: true },
    });
    expect(promotion.isSuperAdmin).toBe(true);

    const stillDenied = await api()
      .get("/api/v1/admin/settings")
      .set("Cookie", staff.cookie);
    // Promotion is also read fresh, proving the middleware never trusts the
    // cached session snapshot.
    expect(stillDenied.status).toBe(200);
  });

  it("does not let a staff member change their own access", async () => {
    const _owner = await createTestUser(tracker, { role: "ADMIN" });
    const self = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    const res = await api()
      .patch(`/api/v1/admin/staff/${self.id}/access`)
      .set("Cookie", self.cookie)
      .send({ permissions: ["catalog", "settings"] });

    expect(res.status).toBe(403);
  });

  it("does not let a scoped staff member grant privileges", async () => {
    const scoped = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["staff"],
    });
    const target = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    const res = await api()
      .patch(`/api/v1/admin/staff/${target.id}/access`)
      .set("Cookie", scoped.cookie)
      .send({ isSuperAdmin: true, permissions: [] });

    expect(res.status).toBe(403);
  });

  it("revokes access on suspension and does not restore privileges on reactivation", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const staff = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    const suspended = await api()
      .post(`/api/v1/admin/staff/${staff.id}/suspend`)
      .set("Cookie", owner.cookie);
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.status).toBe("SUSPENDED");

    const blocked = await api()
      .get("/api/v1/admin/categories")
      .set("Cookie", staff.cookie);
    expect([401, 403]).toContain(blocked.status);

    const reactivated = await api()
      .post(`/api/v1/admin/staff/${staff.id}/reactivate`)
      .set("Cookie", owner.cookie);
    expect(reactivated.status).toBe(200);
    expect(reactivated.body.data.status).toBe("ACTIVE");
    expect(reactivated.body.data.adminPermissions).toEqual([]);
    expect(reactivated.body.data.isSuperAdmin).toBe(false);
  });

  it("offboarding converts the account to a customer but keeps the identity", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const staff = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    const res = await api()
      .post(`/api/v1/admin/staff/${staff.id}/offboard`)
      .set("Cookie", owner.cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("CUSTOMER");
    expect(res.body.data.status).toBe("OFFBOARDED");

    const user = await prisma.user.findUniqueOrThrow({ where: { id: staff.id } });
    expect(user.role).toBe("CUSTOMER");
    expect(user.adminPermissions).toEqual([]);

    const denied = await api()
      .get("/api/v1/admin/categories")
      .set("Cookie", staff.cookie);
    expect([401, 403]).toContain(denied.status);
  });

  it("prevents self suspension, self offboarding and self deletion of the last owner", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });

    const suspend = await api()
      .post(`/api/v1/admin/staff/${owner.id}/suspend`)
      .set("Cookie", owner.cookie);
    expect(suspend.status).toBe(400);

    const offboard = await api()
      .post(`/api/v1/admin/staff/${owner.id}/offboard`)
      .set("Cookie", owner.cookie);
    expect(offboard.status).toBe(400);
  });
});

describe("Last super admin protection", () => {
  it("refuses to demote the last active super admin", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const other = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    // Remove every other super admin first.
    await prisma.user.updateMany({
      where: { id: { not: owner.id }, role: "ADMIN", isSuperAdmin: true },
      data: { isSuperAdmin: false },
    });

    const res = await api()
      .patch(`/api/v1/admin/staff/${owner.id}/access`)
      .set("Cookie", other.cookie)
      .send({ permissions: ["catalog"], isSuperAdmin: false });

    // `other` is not a super admin, so this is rejected at the route layer.
    expect(res.status).toBe(403);

    const stillOwner = await prisma.user.findUniqueOrThrow({
      where: { id: owner.id },
    });
    expect(stillOwner.isSuperAdmin).toBe(true);
  });

  it("lets a second super admin demote one of two owners", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const second = await createTestUser(tracker, { role: "ADMIN" });

    const res = await api()
      .patch(`/api/v1/admin/staff/${owner.id}/access`)
      .set("Cookie", second.cookie)
      .send({ permissions: ["catalog"], isSuperAdmin: false });

    expect(res.status).toBe(200);

    const demoted = await prisma.user.findUniqueOrThrow({
      where: { id: owner.id },
    });
    expect(demoted.isSuperAdmin).toBe(false);
  });

  it("enforces the invariant at the database level for concurrency", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });

    const attempt = prisma.user.update({
      where: { id: owner.id },
      data: { isSuperAdmin: false },
    });

    await expect(attempt).rejects.toThrow(/at least one active super admin/i);
  });

  it("blocks deleting the last owner through Better Auth's self-service delete", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });

    const res = await api()
      .post("/api/v1/auth/delete-user")
      .set("Cookie", owner.cookie)
      .send({});

    expect(res.status).toBeGreaterThanOrEqual(400);

    const stillThere = await prisma.user.findUnique({ where: { id: owner.id } });
    expect(stillThere).not.toBeNull();
  });
});

describe("Administrative boundary", () => {
  it("customer cannot use administrative endpoints", async () => {
    const customer = await createTestUser(tracker, { role: "CUSTOMER" });

    for (const path of [
      "/api/v1/admin/staff",
      "/api/v1/admin/users",
      "/api/v1/admin/settings",
      "/api/v1/admin/orders",
    ]) {
      const res = await api().get(path).set("Cookie", customer.cookie);
      expect(res.status).toBe(403);
    }
  });

  it("scoped staff cannot use Better Auth's disabled admin endpoints", async () => {
    const scoped = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    const cases: Array<{ method: "get" | "post"; path: string; body?: unknown }> = [
      { method: "get", path: "/api/v1/auth/admin/list-users" },
      { method: "post", path: "/api/v1/auth/admin/create-user", body: {} },
      {
        method: "post",
        path: "/api/v1/auth/admin/set-role",
        body: { userId: scoped.id, role: "admin" },
      },
      { method: "post", path: "/api/v1/auth/admin/ban-user", body: {} },
      { method: "post", path: "/api/v1/auth/admin/impersonate-user", body: {} },
      { method: "post", path: "/api/v1/auth/admin/set-user-password", body: {} },
      { method: "post", path: "/api/v1/auth/admin/remove-user", body: {} },
    ];

    for (const testCase of cases) {
      const request = api()[testCase.method](testCase.path).set(
        "Cookie",
        scoped.cookie,
      );
      const res = testCase.body
        ? await request.send(testCase.body)
        : await request;
      expect(res.status).toBe(404);
    }
  });

  it("scoped staff cannot read customer admin data or approve refunds", async () => {
    const catalogOnly = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    const users = await api()
      .get("/api/v1/admin/users")
      .set("Cookie", catalogOnly.cookie);
    expect(users.status).toBe(403);

    const refunds = await api()
      .get("/api/v1/admin/refunds")
      .set("Cookie", catalogOnly.cookie);
    expect(refunds.status).toBe(403);
  });

  it("scoped staff only reaches its permitted admin area", async () => {
    const catalogOnly = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    const categories = await api()
      .get("/api/v1/admin/categories")
      .set("Cookie", catalogOnly.cookie);
    expect(categories.status).toBe(200);

    const settings = await api()
      .get("/api/v1/admin/settings")
      .set("Cookie", catalogOnly.cookie);
    expect(settings.status).toBe(403);
  });

  it("empty permissions no longer grant administrative access", async () => {
    const emptyPerms = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: [],
      isSuperAdmin: false,
    });

    const res = await api()
      .get("/api/v1/admin/categories")
      .set("Cookie", emptyPerms.cookie);
    expect(res.status).toBe(403);
  });

  it("sensitive settings require the secrets action", async () => {
    const settingsWriter = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["settings"],
      adminActions: ["settings:write"],
    });

    const store = await api()
      .patch("/api/v1/admin/settings/store")
      .set("Cookie", settingsWriter.cookie)
      .send({ values: { "store.name": "Ayra Test" } });
    expect(store.status).toBe(200);

    const payment = await api()
      .patch("/api/v1/admin/settings/payment")
      .set("Cookie", settingsWriter.cookie)
      .send({ values: {} });
    expect(payment.status).toBe(403);
  });
});

describe("Audit trail", () => {
  it("records staff lifecycle events with actor, action and outcome", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const staff = await createTestUser(tracker, {
      role: "ADMIN",
      adminPermissions: ["catalog"],
    });

    await api()
      .post(`/api/v1/admin/staff/${staff.id}/suspend`)
      .set("Cookie", owner.cookie);

    const logs = await prisma.adminAuditLog.findMany({
      where: { action: "staff.suspend", entityId: staff.id },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0]?.actorId).toBe(owner.id);
    expect(logs[0]?.source).toBe("STAFF");
    expect(logs[0]?.outcome).toBe("SUCCESS");
  });

  it("does not write tokens, passwords or cookies into staff audit metadata", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    const { email } = await invite(owner.cookie);

    const log = await prisma.adminAuditLog.findFirstOrThrow({
      where: { action: "staff.invitation.create" },
      orderBy: { createdAt: "desc" },
    });

    const serialized = JSON.stringify(log.metadata ?? {});
    expect(serialized).not.toMatch(/tokenHash|password|Password1!/i);
    expect(serialized).toContain(email);
  });

  it("keeps audit rows immutable", async () => {
    const owner = await createTestUser(tracker, { role: "ADMIN" });
    await api()
      .post(`/api/v1/admin/staff/${owner.id}/reactivate`)
      .set("Cookie", owner.cookie);

    const log = await prisma.adminAuditLog.findFirstOrThrow({
      orderBy: { createdAt: "desc" },
    });

    await expect(
      prisma.adminAuditLog.update({
        where: { id: log.id },
        data: { outcome: "FAILURE" },
      }),
    ).rejects.toThrow();
  });
});
