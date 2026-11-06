import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

describe("PageHeader", () => {
  it("renders the title as the page h1", () => {
    act(() => root.render(<PageHeader title="Products" />));
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.textContent).toBe("Products");
  });

  it("renders a description and actions when provided", () => {
    act(() =>
      root.render(
        <PageHeader
          title="Orders"
          description="Fulfillment list."
          actions={<button type="button">New</button>}
        />,
      ),
    );
    expect(container.textContent).toContain("Fulfillment list.");
    expect(container.querySelector("button")?.textContent).toBe("New");
  });

  it("omits the description paragraph when absent", () => {
    act(() => root.render(<PageHeader title="Brands" />));
    expect(container.querySelector("p")).toBeNull();
  });
});
