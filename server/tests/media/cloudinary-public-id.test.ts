import { describe, expect, it } from "vitest";
import {
  extractCloudinaryPublicId,
  resolveImagePublicId,
} from "../../src/common/utils/cloudinary-public-id.ts";

describe("cloudinary public id", () => {
  it("extracts publicId from a Cloudinary delivery URL", () => {
    expect(
      extractCloudinaryPublicId(
        "https://res.cloudinary.com/demo/image/upload/v123/products/hero.webp"
      )
    ).toBe("products/hero");
  });

  it("prefers an explicit publicId over URL parsing", () => {
    expect(
      resolveImagePublicId(
        "products/a",
        "https://res.cloudinary.com/demo/image/upload/products/b.webp"
      )
    ).toBe("products/a");
  });

  it("falls back to the URL when publicId is missing", () => {
    expect(
      resolveImagePublicId(
        undefined,
        "https://res.cloudinary.com/demo/image/upload/categories/men.jpg"
      )
    ).toBe("categories/men");
  });
});
