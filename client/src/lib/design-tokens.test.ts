import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("design tokens", () => {
  it("keeps semantic primary/secondary authoritative", () => {
    expect(css).toContain("--color-primary: var(--primary)");
    expect(css).toContain("--color-secondary: var(--secondary)");
    expect(css).not.toMatch(/--color-primary:\s*#[0-9a-f]{3,8}/i);
    expect(css).not.toMatch(/--color-secondary:\s*#[0-9a-f]{3,8}/i);
  });

  it("maps destructive foreground", () => {
    expect(css).toContain("--color-destructive-foreground: var(--destructive-foreground)");
  });

  it("defines chart colours for light and dark themes", () => {
    expect(css.match(/--chart-1:/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(css.match(/--chart-5:/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("only declares dark surface tokens inside the dark scope", () => {
    const darkBlock = css.slice(css.indexOf(".dark {"));
    expect(darkBlock).toContain("--background: #111111");
    expect(css.slice(0, css.indexOf(".dark {"))).not.toContain("--background: #111111");
  });
});
