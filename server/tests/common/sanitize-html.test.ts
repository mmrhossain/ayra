import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "../../src/common/utils/sanitize-html.ts";

describe("sanitizeHtml", () => {
  it("removes script tags and their content", () => {
    expect(sanitizeHtml("<script>alert(1)</script><p>Hello</p>")).toBe("<p>Hello</p>");
  });

  it("removes event handler attributes", () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('<img src="x" />');
  });

  it("removes javascript URLs", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a rel="noopener noreferrer">x</a>'
    );
  });

  it("removes style and iframe tags", () => {
    expect(sanitizeHtml("<style>body{display:none}</style><iframe src=\"x\"></iframe><p>ok</p>")).toBe(
      "<p>ok</p>"
    );
  });

  it("keeps safe formatting and adds noreferrer to links", () => {
    expect(sanitizeHtml('<p><strong>Hi</strong> <a href="https://example.com">link</a></p>')).toBe(
      '<p><strong>Hi</strong> <a href="https://example.com" rel="noopener noreferrer">link</a></p>'
    );
  });
});
