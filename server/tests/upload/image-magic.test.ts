import { describe, expect, it } from "vitest";
import { assertAllowedImageBuffer } from "../../src/common/utils/image-magic.ts";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64"
);

const JPEG_SOI = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x0c, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP"),
]);

describe("assertAllowedImageBuffer", () => {
  it("accepts a real PNG with matching mime and extension", () => {
    expect(() =>
      assertAllowedImageBuffer(PNG_1X1, "image/png", "hero.png")
    ).not.toThrow();
  });

  it("accepts JPEG and WebP signatures", () => {
    expect(() =>
      assertAllowedImageBuffer(JPEG_SOI, "image/jpeg", "hero.jpg")
    ).not.toThrow();
    expect(() =>
      assertAllowedImageBuffer(WEBP, "image/webp", "hero.webp")
    ).not.toThrow();
  });

  it("rejects extension-spoofed non-image payloads", () => {
    try {
      assertAllowedImageBuffer(
        Buffer.from("<?php echo 1;"),
        "image/jpeg",
        "hero.jpg"
      );
      throw new Error("expected AppError");
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 400 });
    }
  });

  it("rejects mime that does not match magic bytes", () => {
    try {
      assertAllowedImageBuffer(PNG_1X1, "image/jpeg", "hero.jpg");
      throw new Error("expected AppError");
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 400 });
    }
  });

  it("rejects extension that does not match magic bytes", () => {
    try {
      assertAllowedImageBuffer(PNG_1X1, "image/png", "hero.jpg");
      throw new Error("expected AppError");
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 400 });
    }
  });
});
