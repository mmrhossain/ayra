import { beforeEach, describe, expect, it, vi } from "vitest";
const db = vi.hoisted(() => ({ user: { findUnique: vi.fn() }, customerProfile: { findUnique: vi.fn(), create: vi.fn() }, $queryRaw: vi.fn() }));
vi.mock("../../src/lib/prisma.ts", () => ({ prisma: db }));
import { getOrCreateCustomerProfile } from "../../src/common/utils/customerProfile.ts";
beforeEach(() => { vi.resetAllMocks(); db.user.findUnique.mockResolvedValue({ id: "owner", role: "CUSTOMER" }); db.customerProfile.findUnique.mockResolvedValue({ id: "profile", userId: "owner" }); });
describe("request-scoped verified customer lookup", () => {
  it("reuses a freshly verified user without querying it again", async () => {
    expect(await getOrCreateCustomerProfile("owner", { id: "owner", role: "CUSTOMER" })).toEqual({ id: "profile", userId: "owner" }); expect(db.user.findUnique).not.toHaveBeenCalled();
  });
  it("preserves the existing database check when no verified user is supplied", async () => {
    await getOrCreateCustomerProfile("owner"); expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: "owner" } });
  });
  it("does not reuse a different user's authorization snapshot", async () => {
    await getOrCreateCustomerProfile("owner", { id: "other", role: "CUSTOMER" }); expect(db.user.findUnique).toHaveBeenCalledOnce();
  });
  it("still rejects a verified staff account", async () => {
    await expect(getOrCreateCustomerProfile("owner", { id: "owner", role: "ADMIN" })).rejects.toMatchObject({ statusCode: 403 }); expect(db.customerProfile.findUnique).not.toHaveBeenCalled();
  });
  it("preserves creation when a verified customer has no profile yet", async () => {
    db.customerProfile.findUnique.mockResolvedValue(null); db.$queryRaw.mockResolvedValue([{ reference: 1n }]); db.customerProfile.create.mockResolvedValue({ id: "created" });
    expect(await getOrCreateCustomerProfile("owner", { id: "owner", role: "CUSTOMER" })).toEqual({ id: "created" }); expect(db.customerProfile.create).toHaveBeenCalledWith({ data: { userId: "owner", customerCode: expect.stringMatching(/^CUST-\d{6}-001$/) } });
  });
});
