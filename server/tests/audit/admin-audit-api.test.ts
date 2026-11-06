import { afterEach, describe, expect, it } from "vitest";

import { toAuditLogCsv, auditLogCsvFilename } from "../../src/modules/audit/admin-audit.csv.ts";
import { prisma } from "../../src/lib/prisma.ts";
import { recordAdminAudit } from "../../src/modules/audit/admin-audit.service.ts";
import { CleanupTracker, api, createTestUser } from "../helpers/index.ts";

const tracker = new CleanupTracker();

afterEach(async () => {
  await tracker.cleanup();
});

const suffix = () => `audit-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

describe("Audit log API", () => {
  it("filters by actor email, action, outcome and free-text search", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: suffix(),
    });
    const uniqueAction = `orders.update.${suffix()}`;
    const uniqueRequestId = `req-${suffix()}`;

    await recordAdminAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: "ADMIN",
      action: uniqueAction,
      method: "PATCH",
      path: "/api/v1/admin/orders/ord-1/status",
      statusCode: 200,
      requestId: uniqueRequestId,
      durationMs: 42,
      entityType: "orders",
      entityId: "ord-1",
    });
    await recordAdminAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: "ADMIN",
      action: `${uniqueAction}.delete`,
      method: "DELETE",
      path: "/api/v1/admin/products/prod-9",
      statusCode: 400,
    });

    const byEmail = await api()
      .get(`/api/v1/admin/audit-log?actorEmail=${encodeURIComponent(admin.email)}`)
      .set("Cookie", admin.cookie);
    expect(byEmail.status).toBe(200);
    expect(byEmail.body.data.pagination.total).toBe(2);

    const byOutcome = await api()
      .get(`/api/v1/admin/audit-log?actorEmail=${encodeURIComponent(admin.email)}&outcome=FAILURE`)
      .set("Cookie", admin.cookie);
    expect(byOutcome.body.data.pagination.total).toBe(1);
    expect(byOutcome.body.data.items[0].action).toBe(`${uniqueAction}.delete`);

    const byAction = await api()
      .get(`/api/v1/admin/audit-log?action=${uniqueAction}`)
      .set("Cookie", admin.cookie);
    expect(byAction.body.data.pagination.total).toBe(1);

    const bySearch = await api()
      .get(`/api/v1/admin/audit-log?search=${uniqueRequestId}`)
      .set("Cookie", admin.cookie);
    expect(bySearch.body.data.pagination.total).toBe(1);
    expect(bySearch.body.data.items[0].requestId).toBe(uniqueRequestId);
    expect(bySearch.body.data.items[0].durationMs).toBe(42);
  });

  it("returns a single entry by id", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: suffix(),
    });
    const uniqueAction = `settings.update.${suffix()}`;
    await recordAdminAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: uniqueAction,
      method: "PUT",
      path: "/api/v1/admin/settings",
      statusCode: 200,
    });

    const list = await api()
      .get(`/api/v1/admin/audit-log?action=${uniqueAction}`)
      .set("Cookie", admin.cookie);
    const id = list.body.data.items[0].id as string;

    const detail = await api()
      .get(`/api/v1/admin/audit-log/${id}`)
      .set("Cookie", admin.cookie);
    expect(detail.status).toBe(200);
    expect(detail.body.data.id).toBe(id);

    const missing = await api()
      .get(`/api/v1/admin/audit-log/does-not-exist`)
      .set("Cookie", admin.cookie);
    expect(missing.status).toBe(404);
  });

  it("exports CSV with headers and filter support", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: suffix(),
    });
    const uniqueAction = `orders.csv.${suffix()}`;
    await recordAdminAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: uniqueAction,
      method: "PATCH",
      path: "/api/v1/admin/orders/ord-2/status",
      statusCode: 200,
      requestId: "req-csv-1",
      durationMs: 12,
      metadata: { note: 'has, comma and "quote"' },
    });

    const res = await api()
      .get(`/api/v1/admin/audit-log/export?action=${uniqueAction}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain(".csv");
    expect(res.text).toContain("createdAt,actorEmail,actorRole");
    expect(res.text).toContain(uniqueAction);
    expect(res.text).toContain("req-csv-1");
    expect(res.text).toContain("has, comma");
  });

  it("requires the audit permission", async () => {
    const staff = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: suffix(),
      adminPermissions: ["orders"],
    });

    const res = await api()
      .get("/api/v1/admin/audit-log")
      .set("Cookie", staff.cookie);
    expect(res.status).toBe(403);

    const exportRes = await api()
      .get("/api/v1/admin/audit-log/export")
      .set("Cookie", staff.cookie);
    expect(exportRes.status).toBe(403);
  });

  it("records request telemetry for real admin writes", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: suffix(),
    });

    const code = `TELE${Date.now()}`;
    const res = await api()
      .post("/api/v1/admin/coupons")
      .set("Cookie", admin.cookie)
      .set("X-Request-Id", `req-telemetry-${Date.now()}`)
      .send({
        code,
        name: `Telemetry coupon ${code}`,
        discountType: "PERCENTAGE",
        discountValue: 5,
        startsAt: new Date(Date.now() - 60_000).toISOString(),
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        applicableProductIds: [],
        applicableCategoryIds: [],
      });

    if (res.body?.data?.id) tracker.couponIds.push(res.body.data.id);

    const requestId = res.request?.getHeader("x-request-id") as string;
    expect(requestId).toBeTruthy();

    const entry = await prisma.adminAuditLog.findFirst({
      where: { requestId },
    });
    expect(entry).not.toBeNull();
    expect(entry?.method).toBe("POST");
    expect(entry?.durationMs).not.toBeNull();
    expect(entry?.durationMs).toBeGreaterThanOrEqual(0);
    expect(entry?.actorId).toBe(admin.id);
  });
});

describe("toAuditLogCsv", () => {
  it("escapes commas, quotes and newlines", () => {
    const csv = toAuditLogCsv([
      {
        createdAt: new Date("2026-11-04T10:00:00.000Z"),
        actorEmail: "admin@example.com",
        actorRole: "ADMIN",
        source: "APP",
        action: "orders.update",
        method: "PATCH",
        path: "/line\nbreak",
        entityType: "orders",
        entityId: "o1",
        statusCode: 200,
        outcome: "SUCCESS",
        durationMs: 10,
        requestId: "r1",
        ip: "127.0.0.1",
        userAgent: 'Agent, "quoted"',
        metadata: { a: 1 },
      },
    ]);

    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"Agent, ""quoted"""');
    expect(csv).toContain("/line break");
    expect(csv).toContain('"{""a"":1}"');
  });

  it("builds a timestamped filename", () => {
    expect(auditLogCsvFilename(new Date("2026-11-04T10:11:12.000Z"))).toBe(
      "admin-audit-log-2026-11-04T10-11-12.csv",
    );
  });
});
