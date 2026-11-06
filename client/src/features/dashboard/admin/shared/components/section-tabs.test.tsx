import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SectionTabs } from "./section-tabs";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  params: new URLSearchParams(""),
  pathname: "/admin/blogs",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.params,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mocks.params = new URLSearchParams("");
  mocks.replace.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const SECTIONS = [
  { value: "posts", label: "Posts", content: <p>Posts body</p> },
  { value: "categories", label: "Categories", content: <p>Categories body</p> },
];

describe("SectionTabs", () => {
  it("renders a tab per section in the given order", () => {
    act(() => root.render(<SectionTabs sections={SECTIONS} />));
    expect(
      Array.from(container.querySelectorAll('[role="tab"]')).map(
        (tab) => tab.textContent,
      ),
    ).toEqual(["Posts", "Categories"]);
  });

  it("shows only the active section's content", () => {
    act(() => root.render(<SectionTabs sections={SECTIONS} />));
    expect(container.textContent).toContain("Posts body");
    expect(container.textContent).not.toContain("Categories body");
  });

  it("writes the selected tab to the URL without scrolling", () => {
    act(() => root.render(<SectionTabs sections={SECTIONS} />));
    const categoriesTab = Array.from(
      container.querySelectorAll<HTMLElement>('[role="tab"]'),
    ).find((tab) => tab.textContent === "Categories")!;
    act(() => {
      categoriesTab.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, button: 0 }),
      );
    });
    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/blogs?tab=categories",
      { scroll: false },
    );
  });
});
