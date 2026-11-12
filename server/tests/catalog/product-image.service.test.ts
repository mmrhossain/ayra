import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/prisma.ts", () => ({ prisma: {} }));
vi.mock("../../src/modules/media/media.service.ts", () => ({
  attachMediaAssets: vi.fn(),
  detachMediaAssets: vi.fn(),
}));

const { imagePublicIds, toProductImageRows } = await import(
  "../../src/modules/catalog/product/services/product-image.service.ts"
);

describe("imagePublicIds", () => {
  it("extracts publicId from wizard payloads that only send url", () => {
    expect(
      imagePublicIds([
        {
          url: "https://res.cloudinary.com/demo/image/upload/c_fill,dpr_auto,f_auto,g_auto,h_1200,q_auto:good,w_1200/ldqslqlohxtmpcazn7mq?_a=BAMAROiu0",
          isPrimary: true,
        },
      ]),
    ).toEqual(["ldqslqlohxtmpcazn7mq"]);
  });

  it("prefers imageUrl when both url and imageUrl are present", () => {
    expect(
      imagePublicIds([
        {
          url: "https://res.cloudinary.com/demo/image/upload/oldid.webp",
          imageUrl: "https://res.cloudinary.com/demo/image/upload/newid.webp",
        },
      ]),
    ).toEqual(["newid"]);
  });
});

describe("toProductImageRows", () => {
  it("stores imageUrl from url-only payloads and resolves publicId", () => {
    const rows = toProductImageRows(
      [
        {
          url: "https://res.cloudinary.com/demo/image/upload/hero.webp",
          isPrimary: true,
        },
      ],
      "prod-1",
    );

    expect(rows).toEqual([
      {
        imageUrl: "https://res.cloudinary.com/demo/image/upload/hero.webp",
        publicId: "hero",
        isPrimary: true,
        sortOrder: 0,
        productId: "prod-1",
      },
    ]);
  });
});
