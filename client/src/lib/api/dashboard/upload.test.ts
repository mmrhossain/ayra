import { describe, expect, it } from "vitest";

import { resolveImageType } from "@/lib/api/dashboard/upload";

describe("resolveImageType", () => {
  it("maps site branding uploads to their dedicated media types", () => {
    expect(resolveImageType("site-logo")).toBe("site_logo");
    expect(resolveImageType("og-image")).toBe("og_image");
  });
});
