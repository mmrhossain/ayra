import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { PageError } from "./page-error";

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

describe("PageError", () => {
  it("exposes the failure as an alert", () => {
    act(() =>
      root.render(<PageError title="Could not load" message="Network error" />),
    );
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain("Could not load");
    expect(alert?.textContent).toContain("Network error");
  });

  it("renders an action", () => {
    act(() =>
      root.render(
        <PageError
          title="Could not load orders"
          message="Network error"
          action={<a href="/admin/orders">Retry</a>}
        />,
      ),
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/admin/orders",
    );
  });
});
