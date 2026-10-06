import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const findUnique = vi.fn();

vi.mock("../../src/lib/prisma.ts", () => ({
  prisma: {
    vendorProfile: {
      findUnique,
    },
  },
}));

const {
  requireMultipleUploadPermission,
  requireSingleUploadPermission,
} = await import("../../src/modules/media/media.permission.ts");

const call = (
  middleware: (req: Request, res: Response, next: (err?: unknown) => void) => void,
  role: string | undefined,
  type: string,
  userId = "u1"
) =>
  new Promise<{ ok: boolean; err?: { statusCode?: number } }>((resolve) => {
    const req = {
      auth: role ? { user: { id: userId, email: "a@b.c", role } } : undefined,
      query: { type },
      body: {},
    } as unknown as Request;

    void middleware(req, {} as Response, (err?: unknown) => {
      if (err) {
        resolve({ ok: false, err: err as { statusCode?: number } });
        return;
      }
      resolve({ ok: true });
    });
  });

describe("upload permission", () => {
  it("allows ADMIN for catalog types and blocks CUSTOMER", async () => {
    await expect(call(requireSingleUploadPermission, "ADMIN", "slider")).resolves.toEqual({
      ok: true,
    });
    await expect(call(requireSingleUploadPermission, "CUSTOMER", "slider")).resolves.toMatchObject({
      ok: false,
      err: { statusCode: 403 },
    });
    await expect(call(requireMultipleUploadPermission, "CUSTOMER", "product")).resolves.toMatchObject({
      ok: false,
      err: { statusCode: 403 },
    });
  });

  it("allows CUSTOMER only for customer_avatar", async () => {
    await expect(
      call(requireSingleUploadPermission, "CUSTOMER", "customer_avatar")
    ).resolves.toEqual({ ok: true });
    await expect(
      call(requireSingleUploadPermission, "CUSTOMER", "vendor_avatar")
    ).resolves.toMatchObject({ ok: false, err: { statusCode: 403 } });
  });

  it("allows approved VENDOR for vendor_avatar and blocks catalog types", async () => {
    findUnique.mockResolvedValueOnce({ isApproved: true });
    await expect(
      call(requireSingleUploadPermission, "VENDOR", "vendor_avatar")
    ).resolves.toEqual({ ok: true });
    await expect(call(requireSingleUploadPermission, "VENDOR", "category")).resolves.toMatchObject({
      ok: false,
      err: { statusCode: 403 },
    });
  });

  it("blocks unapproved VENDOR from vendor_avatar", async () => {
    findUnique.mockResolvedValueOnce({ isApproved: false });
    await expect(
      call(requireSingleUploadPermission, "VENDOR", "vendor_avatar")
    ).resolves.toMatchObject({
      ok: false,
      err: { statusCode: 403 },
    });
  });
});
