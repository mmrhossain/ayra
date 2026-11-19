import { describe, expect, it } from "vitest";
import { profileImageUrl } from "./profile-image";

describe("Profile image display resolution", () => {
  it("requests a larger Google thumbnail and preserves crop flags", () => {
    expect(profileImageUrl("https://lh3.googleusercontent.com/a/example=s96-c", 768)).toBe("https://lh3.googleusercontent.com/a/example=s768-c");
  });
  it("preserves the original source value and query parameters", () => {
    const source = "https://lh3.googleusercontent.com/a/example=s96-c?test=1";
    expect(profileImageUrl(source, 256)).toBe("https://lh3.googleusercontent.com/a/example=s256-c?test=1");
    expect(source).toContain("=s96-c");
  });
  it.each(["https://res.cloudinary.com/example/image/upload/photo.jpg", "blob:http://localhost:3000/example", "/images/profile.png", "", "https://example.com/photo=s96-c", "https://lh3.googleusercontent.com/a/original"])("preserves non-thumbnail or uploaded source %s", source => {
    expect(profileImageUrl(source, 768)).toBe(source);
  });
});
