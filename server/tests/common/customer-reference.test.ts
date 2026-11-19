import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../src/generated/prisma/client.ts";
const mocks = vi.hoisted(() => ({ user: vi.fn(), profile: vi.fn(), create: vi.fn(), next: vi.fn() }));
vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: { user: { findUnique: mocks.user }, customerProfile: { findUnique: mocks.profile, create: mocks.create }, $queryRaw: mocks.next },
}));
import { formatCustomerCode, getOrCreateCustomerProfile } from "../../src/common/utils/customerProfile.ts";

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-19T10:00:00.000Z"));
  mocks.user.mockResolvedValue({ id: "customer", role: "CUSTOMER" });
  mocks.profile.mockResolvedValue(null);
  let reference = 0n;
  mocks.next.mockImplementation(async () => [{ reference: ++reference }]);
  mocks.create.mockImplementation(async ({ data }) => ({ id: "profile", ...data }));
});
afterEach(() => { vi.useRealTimers(); });
const conflict = (field: string) => new Prisma.PrismaClientKnownRequestError("Unique conflict", { code: "P2002", clientVersion: "test", meta: { target: [field] } });

describe("Customer creation references", () => {
  it.each([[1n, "001"], [2n, "002"], [3n, "003"], [10n, "010"], [100n, "100"], [999n, "999"], [1000n, "1000"]])("formats %s with minimum three-digit decimal padding", (reference, suffix) => {
    expect(formatCustomerCode(reference, new Date("2026-11-19T10:00:00Z"))).toBe("CUST-261119-" + suffix);
  });
  it("uses the same UTC YYMMDD convention as order creation", () => {
    expect(formatCustomerCode(1n, new Date("2026-11-19T01:00:00+06:00"))).toBe("CUST-261118-001");
  });
  it("rejects non-positive references", () => { expect(() => formatCustomerCode(0n)).toThrow(RangeError); });
  it("preserves existing customer IDs and legacy codes without allocating another number", async () => {
    const existing = { id: "existing-profile", userId: "customer", customerCode: "CUST-082E47C3F2" };
    mocks.profile.mockResolvedValue(existing);
    expect(await getOrCreateCustomerProfile("customer")).toBe(existing);
    expect(mocks.next).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("creates only the new public customer code and keeps the existing user association", async () => {
    await getOrCreateCustomerProfile("customer");
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith({ data: { userId: "customer", customerCode: "CUST-261119-001" } });
  });
  it("uses independently allocated sequence values for concurrent new customers", async () => {
    const profiles = await Promise.all(Array.from({ length: 25 }, (_, index) => getOrCreateCustomerProfile("customer-" + index)));
    expect(new Set(profiles.map(profile => profile.customerCode)).size).toBe(25);
    expect(mocks.next).toHaveBeenCalledTimes(25);
  });
  it("returns the existing profile if another request creates the same customer's profile first", async () => {
    const existing = { id: "raced-profile", customerCode: "CUST-261119-002" };
    mocks.profile.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    mocks.create.mockRejectedValueOnce(conflict("userId"));
    expect(await getOrCreateCustomerProfile("customer")).toBe(existing);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
  it("retries a code collision with the next sequence value", async () => {
    mocks.create.mockRejectedValueOnce(conflict("customerCode"));
    expect((await getOrCreateCustomerProfile("customer")).customerCode).toBe("CUST-261119-002");
    expect(mocks.next).toHaveBeenCalledTimes(2);
  });
  it("does not allocate customer codes for staff", async () => {
    mocks.user.mockResolvedValue({ id: "staff", role: "ADMIN" });
    await expect(getOrCreateCustomerProfile("staff")).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.next).not.toHaveBeenCalled();
  });
  it("fails before creation if the sequence does not return a reference", async () => {
    mocks.next.mockResolvedValue([]);
    await expect(getOrCreateCustomerProfile("customer")).rejects.toThrow("Unable to allocate a customer reference");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
