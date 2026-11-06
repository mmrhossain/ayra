import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmptyState } from "./empty-state";

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

describe("EmptyState", () => {
  it("renders a title and body", () => {
    act(() =>
      root.render(<EmptyState title="No zones" body="Add one to start." />),
    );
    expect(container.textContent).toContain("No zones");
    expect(container.textContent).toContain("Add one to start.");
  });

  it("renders actions", () => {
    act(() =>
      root.render(
        <EmptyState
          title="No products"
          actions={
            <>
              <button type="button">Add</button>
              <button type="button">Import</button>
            </>
          }
        />,
      ),
    );
    expect(container.querySelectorAll("button")).toHaveLength(2);
  });
});
