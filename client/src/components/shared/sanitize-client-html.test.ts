import { describe, expect, it } from "vitest";
import { sanitizeClientHtml } from "./sanitize-client-html";

describe("sanitizeClientHtml", () => {
  it("removes script tags", () => {
    const output = sanitizeClientHtml("<p>Hello</p><script>alert(1)</script>");
    expect(output).not.toContain("<script");
    expect(output).toContain("<p>Hello</p>");
  });

  it("removes event handler attributes", () => {
    const output = sanitizeClientHtml('<img src="x" onerror="alert(1)">');
    expect(output).not.toContain("onerror");
  });

  it("removes javascript URLs", () => {
    const output = sanitizeClientHtml('<a href="javascript:alert(1)">x</a>');
    expect(output.toLowerCase()).not.toContain("javascript:");
  });

  it("keeps safe formatting", () => {
    const output = sanitizeClientHtml('<p><strong>Hi</strong> <em>there</em></p>');
    expect(output).toContain("<strong>Hi</strong>");
    expect(output).toContain("<em>there</em>");
  });

  it("removes style and iframe tags", () => {
    const output = sanitizeClientHtml(
      '<style>body{display:none}</style><iframe src="x"></iframe><p>ok</p>'
    );
    expect(output).not.toContain("<style");
    expect(output).not.toContain("<iframe");
    expect(output).toContain("<p>ok</p>");
  });
});
