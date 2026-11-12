import { describe, expect, it } from "vitest";
import {
  extractCloudinaryPublicId,
  generateCloudinaryPublicId,
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

  it("extracts the publicId from a transformed delivery URL with analytics", () => {
    expect(
      extractCloudinaryPublicId(
        "https://res.cloudinary.com/demo/image/upload/c_fill,dpr_auto,f_auto,g_auto,h_1200,q_auto:good,w_1200/ldqslqlohxtmpcazn7mq?_a=BAMAROiu0"
      )
    ).toBe("ldqslqlohxtmpcazn7mq");
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

describe("generateCloudinaryPublicId", () => {
  it("produces a single-segment lowercase alphanumeric id", () => {
    const id = generateCloudinaryPublicId();

    expect(id).toMatch(/^[a-z0-9]{20}$/);
    // Slash-free is the invariant that keeps uniquePublicId, delivery URLs,
    // attach/detach and destroy working unchanged.
    expect(id).not.toContain("/");
  });

  it("survives uniquePublicId unchanged (round-trips through the destroy path)", () => {
    const id = generateCloudinaryPublicId();
    expect(uniquePublicId(id)).toBe(id);
  });

  it("generates distinct ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateCloudinaryPublicId()));
    expect(ids.size).toBe(100);
  });
});
