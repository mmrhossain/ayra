import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const uniqueEmail = (prefix: string) =>
  `${prefix}-${randomUUID().slice(0, 8)}@example.test`;

const trackUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) tracker.userIds.push(user.id);
  return user;
};

describe("Auth sign-up and sign-in", () => {
  it("sign-up is verification-pending and does not issue a session token", async () => {
    const email = uniqueEmail("signup");
    const res = await api()
      .post("/api/v1/auth/sign-up/email")
      .send({ name: "Signup User", email, password: "Password1!" });

    await trackUserByEmail(email);

    expect(res.status).toBeLessThan(400);
    expect(res.body.token ?? null).toBeNull();

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.emailVerified).toBe(false);
  });

  it("verified user sign-in returns a session token", async () => {
    const email = uniqueEmail("signin");
    const password = "Password1!";

    const signup = await api()
      .post("/api/v1/auth/sign-up/email")
      .send({ name: "Verified User", email, password });
    expect(signup.status).toBeLessThan(400);
    await trackUserByEmail(email);

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    const res = await api()
      .post("/api/v1/auth/sign-in/email")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user?.email ?? email).toBe(email);
  });

  it("unverified user sign-in returns 403 EMAIL_NOT_VERIFIED", async () => {
    const email = uniqueEmail("unverified");
    const password = "Password1!";

    const signup = await api()
      .post("/api/v1/auth/sign-up/email")
      .send({ name: "Unverified User", email, password });
    expect(signup.status).toBeLessThan(400);
    await trackUserByEmail(email);

    const res = await api()
      .post("/api/v1/auth/sign-in/email")
      .send({ email, password });

    expect(res.status).toBe(403);
    const payload = JSON.stringify(res.body);
    expect(payload).toMatch(/EMAIL_NOT_VERIFIED/i);
  });
});

describe("Google social sign-in", () => {
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  it.skipIf(!googleConfigured)(
    "returns a Google authorize URL with the Better Auth callback path",
    async () => {
      const res = await api()
        .post("/api/v1/auth/sign-in/social")
        .send({
          provider: "google",
          callbackURL: "http://localhost:3000/oauth/complete",
          errorCallbackURL: "http://localhost:3000/login",
          disableRedirect: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.redirect).toBe(false);
      expect(typeof res.body.url).toBe("string");
      expect(res.body.url).toContain("accounts.google.com");
      expect(res.body.url).toContain(
        encodeURIComponent("http://localhost:5000/api/v1/auth/callback/google"),
      );
    },
  );

  it("rejects an unknown social provider", async () => {
    const res = await api()
      .post("/api/v1/auth/sign-in/social")
      .send({ provider: "not-a-provider", disableRedirect: true });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("Password reset", () => {
  it("request-password-reset accepts a registered email", async () => {
    const email = uniqueEmail("reset");
    const password = "Password1!";

    const signup = await api()
      .post("/api/v1/auth/sign-up/email")
      .send({ name: "Reset User", email, password });
    expect(signup.status).toBeLessThan(400);
    await trackUserByEmail(email);

    const res = await api()
      .post("/api/v1/auth/request-password-reset")
      .send({
        email,
        redirectTo: "http://localhost:3000/reset-password",
      });

    expect(res.status).toBeLessThan(400);
  });

  it("reset-password without a token is rejected", async () => {
    const res = await api()
      .post("/api/v1/auth/reset-password")
      .send({ newPassword: "Password2!" });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("User suspension", () => {
  it("admin can ban a user and requireAuth rejects the banned session", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `ban-admin-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `ban-user-${Date.now()}`,
    });

    const ban = await api()
      .patch(`/api/v1/admin/users/${customer.id}/ban`)
      .set("Cookie", admin.cookie)
      .send({ banReason: "Abuse" });

    expect(ban.status).toBe(200);
    expect(ban.body.data.banned).toBe(true);

    const sessions = await prisma.session.count({
      where: { userId: customer.id },
    });
    expect(sessions).toBe(0);

    const blocked = await api()
      .get("/api/v1/orders")
      .set("Cookie", customer.cookie);

    expect([401, 403]).toContain(blocked.status);
    expect(String(blocked.body.message)).toMatch(/Account suspended|Unauthorized/i);
  });

  it("requireAuth returns Account suspended when the session user is banned", async () => {
    const user = await createTestUser(tracker, {
      suffix: `ban-session-${Date.now()}`,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { banned: true, banReason: "Manual" },
    });

    const res = await api().get("/api/v1/orders").set("Cookie", user.cookie);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Account suspended");
  });

  it("admin can unban a user", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `unban-admin-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `unban-user-${Date.now()}`,
    });

    const ban = await api()
      .patch(`/api/v1/admin/users/${customer.id}/ban`)
      .set("Cookie", admin.cookie)
      .send({ banReason: "Temp" });
    expect(ban.status).toBe(200);

    const unban = await api()
      .patch(`/api/v1/admin/users/${customer.id}/unban`)
      .set("Cookie", admin.cookie);

    expect(unban.status).toBe(200);
    expect(unban.body.data.banned).toBe(false);
  });

  it("admin can list users and vendors; customer and vendor cannot", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `ulist-admin-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `ulist-cust-${Date.now()}`,
    });
    const vendor = await createTestUser(tracker, {
      role: "VENDOR",
      suffix: `ulist-vend-${Date.now()}`,
    });

    const unauth = await api().get("/api/v1/admin/users");
    expect(unauth.status).toBe(401);

    const customerDenied = await api()
      .get("/api/v1/admin/users")
      .set("Cookie", customer.cookie);
    expect(customerDenied.status).toBe(403);

    const vendorDenied = await api()
      .get("/api/v1/admin/users?role=VENDOR")
      .set("Cookie", vendor.cookie);
    expect(vendorDenied.status).toBe(403);

    const listed = await api()
      .get("/api/v1/admin/users")
      .set("Cookie", admin.cookie);
    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body.data.items)).toBe(true);
    expect(listed.body.data.pagination).toMatchObject({
      page: 1,
      limit: expect.any(Number),
      total: expect.any(Number),
    });
    expect(listed.body.data.items.some((u: { id: string }) => u.id === customer.id)).toBe(true);
    expect(listed.body.data.items[0]).not.toHaveProperty("password");
    expect(listed.body.data.items[0]).not.toHaveProperty("token");

    const vendors = await api()
      .get("/api/v1/admin/users")
      .query({ role: "VENDOR" })
      .set("Cookie", admin.cookie);
    expect(vendors.status).toBe(200);
    expect(vendors.body.data.items.every((u: { vendorProfile: unknown }) => u.vendorProfile)).toBe(true);
    expect(
      vendors.body.data.items.some((u: { id: string }) => u.id === vendor.id),
    ).toBe(true);
  });

  it("admin can fetch a user by id", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `uget-admin-${Date.now()}`,
    });
    const customer = await createTestUser(tracker, {
      suffix: `uget-user-${Date.now()}`,
    });

    const unauth = await api().get(`/api/v1/admin/users/${customer.id}`);
    expect(unauth.status).toBe(401);

    const forbidden = await api()
      .get(`/api/v1/admin/users/${customer.id}`)
      .set("Cookie", customer.cookie);
    expect(forbidden.status).toBe(403);

    const res = await api()
      .get(`/api/v1/admin/users/${customer.id}`)
      .set("Cookie", admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(customer.id);
    expect(res.body.data.email).toBe(customer.email);
  });
});

describe("Vendor approval", () => {
  it("customer can apply as vendor once", async () => {
    const user = await createTestUser(tracker, {
      suffix: `vapply-${Date.now()}`,
    });
    const tag = randomUUID().slice(0, 8);

    const applied = await api()
      .post("/api/v1/auth/vendor/apply")
      .set("Cookie", user.cookie)
      .send({
        shopName: `Apply Shop ${tag}`,
        shopSlug: `apply-shop-${tag}`,
      });

    expect(applied.status).toBe(201);
    expect(applied.body.data.isApproved).toBe(false);

    const duplicate = await api()
      .post("/api/v1/auth/vendor/apply")
      .set("Cookie", user.cookie)
      .send({
        shopName: `Apply Shop ${tag} 2`,
        shopSlug: `apply-shop-${tag}-2`,
      });

    expect(duplicate.status).toBe(409);
  });

  it("unapproved vendor cannot update vendor profile", async () => {
    const vendor = await createTestUser(tracker, {
      role: "VENDOR",
      isApproved: false,
      suffix: `vunap-${Date.now()}`,
    });

    const res = await api()
      .patch("/api/v1/vendor/profile")
      .set("Cookie", vendor.cookie)
      .send({ shopName: "Hijack Shop" });

    expect(res.status).toBe(403);
  });

  it("unapproved vendor cannot access restricted admin routes", async () => {
    const vendor = await createTestUser(tracker, {
      role: "VENDOR",
      isApproved: false,
      suffix: `vend-${Date.now()}`,
    });

    const res = await api()
      .post("/api/v1/admin/categories")
      .set("Cookie", vendor.cookie)
      .send({
        name: `Blocked Cat ${randomUUID().slice(0, 8)}`,
        slug: `blocked-cat-${randomUUID().slice(0, 8)}`,
      });

    expect(res.status).toBe(403);
  });

  it("approved vendor still cannot mutate catalog (admin-only CUD)", async () => {
    const vendor = await createTestUser(tracker, {
      role: "VENDOR",
      isApproved: true,
      suffix: `vap-${Date.now()}`,
    });

    const tag = randomUUID().slice(0, 8);
    const res = await api()
      .post("/api/v1/admin/categories")
      .set("Cookie", vendor.cookie)
      .send({ name: `Approved Cat ${tag}`, slug: `approved-cat-${tag}` });

    expect(res.status).toBe(403);
  });
});
