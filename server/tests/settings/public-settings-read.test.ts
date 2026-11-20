import { beforeEach, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ platformSetting: { findMany: vi.fn(), findUnique: vi.fn() } }));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: db, transaction: vi.fn() }));
vi.mock("../../src/modules/media/media.service.ts", () => ({ attachMediaAssets: vi.fn(), detachMediaAssets: vi.fn() }));
import { clearSettingsCache, getPublicSettings, getSettingValue } from "../../src/modules/settings/settings.service.ts";
beforeEach(() => { vi.resetAllMocks(); clearSettingsCache(); db.platformSetting.findMany.mockResolvedValue([]); });
it("loads all nine public settings with one cold database query", async () => {
  db.platformSetting.findMany.mockResolvedValue([{ key: "store.name", value: "Example" }, { key: "checkout.taxEnabled", value: false }]);
  const settings = await getPublicSettings();
  expect(settings.store.name).toBe("Example"); expect(settings.checkout.taxEnabled).toBe(false);
  expect(db.platformSetting.findMany).toHaveBeenCalledOnce(); expect(db.platformSetting.findUnique).not.toHaveBeenCalled();
  const keys = db.platformSetting.findMany.mock.calls[0]![0].where.key.in;
  expect(keys).toHaveLength(9); expect(keys.every((key: string) => !key.includes("Password") && !key.includes("Secret"))).toBe(true);
});
it("reuses the existing per-key cache for repeat public and individual reads", async () => {
  await getPublicSettings(); await getPublicSettings(); await getSettingValue("checkout.taxEnabled");
  expect(db.platformSetting.findMany).toHaveBeenCalledOnce(); expect(db.platformSetting.findUnique).not.toHaveBeenCalled();
});
it("fetches only cold keys when an individual setting is already cached", async () => {
  db.platformSetting.findUnique.mockResolvedValue({ value: "Cached store" });
  await getSettingValue("store.name"); const settings = await getPublicSettings();
  expect(settings.store.name).toBe("Cached store");
  expect(db.platformSetting.findMany.mock.calls[0]![0].where.key.in).not.toContain("store.name");
});
it("keeps default validation and existing cache invalidation", async () => {
  db.platformSetting.findMany.mockResolvedValue([{ key: "checkout.taxEnabled", value: "invalid" }]);
  expect((await getPublicSettings()).checkout.taxEnabled).toBe(true);
  clearSettingsCache(); db.platformSetting.findMany.mockResolvedValue([{ key: "checkout.taxEnabled", value: false }]);
  expect((await getPublicSettings()).checkout.taxEnabled).toBe(false);
  expect(db.platformSetting.findMany).toHaveBeenCalledTimes(2);
});
