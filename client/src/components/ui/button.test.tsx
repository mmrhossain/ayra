import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Button } from "./button";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("Button variants", () => {
  it("uses semantic primary tokens by default", () => {
    act(() => root.render(<Button>Save</Button>));
    const button = container.querySelector("button")!;
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("text-primary-foreground");
    expect(button.className).not.toContain("bg-ink");
  });

  it("uses semantic secondary tokens", () => {
    act(() => root.render(<Button variant="secondary">Cancel</Button>));
    const button = container.querySelector("button")!;
    expect(button.className).toContain("bg-secondary");
    expect(button.className).toContain("text-secondary-foreground");
    expect(button.className).not.toContain("bg-ink");
  });
});
