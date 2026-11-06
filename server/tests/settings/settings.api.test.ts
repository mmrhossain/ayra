import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.ts";
import { clearSettingsCache } from "../../src/modules/settings/settings.service.ts";
import {
  CleanupTracker,
  api,
  createTestUser,
} from "../helpers/index.ts";

const tracker = new CleanupTracker();
const touchedKeys = [
  "payment.enabledMethods",
  "payment.sslcommerz.liveStorePassword",
  "payment.sslcommerz.sandboxStorePassword",
];
let originalRows: Awaited<ReturnType<typeof snapshot>>;
let adminId = "";

const snapshot = async () =>
  prisma.platformSetting.findMany({ where: { key: { in: touchedKeys } } });

beforeEach(async () => {
  originalRows = await snapshot();
});

afterEach(async () => {
  if (adminId) {
    await prisma.platformSettingAudit.deleteMany({
      where: { changedBy: adminId },
    });
  }
  const originals = new Map(originalRows.map((row) => [row.key, row]));
  for (const key of touchedKeys) {
    const original = originals.get(key);
    if (original) {
      await prisma.platformSetting.upsert({
        where: { key },
        update: {
          value: original.value as never,
          isSecret: original.isSecret,
          updatedBy: original.updatedBy,
        },
        create: {
          key: original.key,
          value: original.value as never,
          isSecret: original.isSecret,
          updatedBy: original.updatedBy,
        },
      });
    } else {
      await prisma.platformSetting.deleteMany({ where: { key } });
    }
  }
  clearSettingsCache();
  adminId = "";
  await tracker.cleanup();
});

const field = (
  group: { fields: Array<Record<string, unknown>> },
  key: string,
) => group.fields.find((item) => item.key === key);

describe("settings API", () => {
  it("serves public settings without secrets or callback internals", async () => {
    const res = await api().get("/api/v1/settings/public");

    expect(res.status).toBe(200);
    expect(res.body.data.store.currency).toBe("BDT");
    expect(Array.isArray(res.body.data.payment.enabledMethods)).toBe(true);
    expect(res.body.data.payment).not.toHaveProperty("callbackBaseUrl");
    expect(res.body.data.payment).not.toHaveProperty("sslcommerz");
    expect(res.body.data.checkout).toMatchObject({
      pricesIncludeTax: expect.any(Boolean),
      taxRatePercent: expect.any(Number),
    });
  });

  it("requires an admin for admin settings and audit", async () => {
    const customer = await createTestUser(tracker, {
      suffix: `settings-c-${Date.now()}`,
    });

    expect((await api().get("/api/v1/admin/settings")).status).toBe(401);
    expect(
      (await api().get("/api/v1/admin/settings").set("Cookie", customer.cookie))
        .status,
    ).toBe(403);

    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `settings-a-${Date.now()}`,
    });
    adminId = admin.id;

    const res = await api()
      .get("/api/v1/admin/settings")
      .set("Cookie", admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.map((group: { key: string }) => group.key)).toEqual([
      "store",
      "payment",
      "checkout",
    ]);
  });

  it("stores secrets encrypted and exposes only configured/last4", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `settings-s-${Date.now()}`,
    });
    adminId = admin.id;
    const secret = `live-secret-${Date.now()}`;

    const update = await api()
      .patch("/api/v1/admin/settings/payment")
      .set("Cookie", admin.cookie)
      .send({
        values: {
          "payment.sslcommerz.liveStorePassword": secret,
          "payment.enabledMethods": ["COD"],
        },
      });

    expect(update.status).toBe(200);
    const secretField = field(update.body.data, "payment.sslcommerz.liveStorePassword");
    expect(secretField).toMatchObject({ configured: true, last4: `****${secret.slice(-4)}` });
    expect(secretField).not.toHaveProperty("value");
    expect(JSON.stringify(update.body)).not.toContain(secret);

    expect(field(update.body.data, "payment.enabledMethods")?.value).toEqual([
      "COD",
    ]);

    const row = await prisma.platformSetting.findUniqueOrThrow({
      where: { key: "payment.sslcommerz.liveStorePassword" },
    });
    expect(JSON.stringify(row.value)).not.toContain(secret);

    const audit = await api()
      .get("/api/v1/admin/settings/audit")
      .set("Cookie", admin.cookie);
    expect(audit.status).toBe(200);
    const entry = audit.body.data.items.find(
      (item: { settingKey: string }) =>
        item.settingKey === "payment.sslcommerz.liveStorePassword",
    );
    expect(entry.newValue).toBe("[redacted]");
    expect(JSON.stringify(audit.body)).not.toContain(secret);

    const cleared = await api()
      .patch("/api/v1/admin/settings/payment")
      .set("Cookie", admin.cookie)
      .send({
        values: { "payment.sslcommerz.liveStorePassword": "" },
      });
    expect(cleared.status).toBe(200);
    expect(
      field(cleared.body.data, "payment.sslcommerz.liveStorePassword"),
    ).toMatchObject({ configured: false, last4: null });
  });

  it("rejects read-only and unknown settings", async () => {
    const admin = await createTestUser(tracker, {
      role: "ADMIN",
      suffix: `settings-r-${Date.now()}`,
    });
    adminId = admin.id;

    const readOnly = await api()
      .patch("/api/v1/admin/settings/store")
      .set("Cookie", admin.cookie)
      .send({ values: { "store.currency": "USD" } });
    expect(readOnly.status).toBe(400);

    const unknown = await api()
      .patch("/api/v1/admin/settings/store")
      .set("Cookie", admin.cookie)
      .send({ values: { "store.notARealKey": "x" } });
    expect(unknown.status).toBe(400);
  });
});
