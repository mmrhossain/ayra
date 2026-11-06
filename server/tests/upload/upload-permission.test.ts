import { describe, expect, it } from "vitest";
import type { Request, Response } from "express";

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
      auth: role
        ? {
            user: {
              id: userId,
              email: "a@b.c",
              role,
              isSuperAdmin: role === "ADMIN",
              banned: false,
            },
          }
        : undefined,
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
      call(requireSingleUploadPermission, "CUSTOMER", "product")
    ).resolves.toMatchObject({ ok: false, err: { statusCode: 403 } });
  });
});
