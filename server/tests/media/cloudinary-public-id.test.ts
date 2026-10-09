import { describe, expect, it } from "vitest";
import {
  extractCloudinaryPublicId,
  resolveImagePublicId,
  uniquePublicId,
} from "../../src/common/utils/cloudinary-public-id.ts";

describe("cloudinary public id", () => {
  it("keeps Cloudinary unique ids unchanged", () => {
    expect(uniquePublicId("awxvgitg1do5vu2a2xtw")).toBe("awxvgitg1do5vu2a2xtw");
  });

  it("strips folder prefixes from stored public ids", () => {
    expect(uniquePublicId("sliders/awxvgitg1do5vu2a2xtw")).toBe(
      "awxvgitg1do5vu2a2xtw"
    );
    expect(uniquePublicId("ayra/products/hero.webp")).toBe("hero");
  });

  it("extracts the unique publicId from a Cloudinary delivery URL", () => {
    expect(
      extractCloudinaryPublicId(
        "https://res.cloudinary.com/demo/image/upload/v123/products/hero.webp"
      )
    ).toBe("hero");
  });

  it("prefers an explicit publicId over URL parsing and stores the unique id", () => {
    expect(
      resolveImagePublicId(
        "products/a",
        "https://res.cloudinary.com/demo/image/upload/products/b.webp"
      )
    ).toBe("a");
  });

  it("falls back to the unique id in the URL when publicId is missing", () => {
    expect(
      resolveImagePublicId(
        undefined,
        "https://res.cloudinary.com/demo/image/upload/categories/men.jpg"
      )
    ).toBe("men");
  });
});
