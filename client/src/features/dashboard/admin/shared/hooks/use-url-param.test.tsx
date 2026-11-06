import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUrlParam } from "./use-url-param";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  params: new URLSearchParams("tab=categories"),
  pathname: "/admin/blogs",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.params,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SLUGS = ["posts", "categories"] as const;

let container: HTMLDivElement;
let root: Root;

function Probe() {
  const [value, setValue] = useUrlParam("tab", SLUGS, "posts");
  // Read the hook's value back out of the DOM rather than assigning to a module
  // variable during render.
  return (
    <>
      <output>{value}</output>
      <button type="button" onClick={() => setValue("posts")}>
        posts
      </button>
      <button type="button" onClick={() => setValue("categories")}>
        categories
      </button>
    </>
  );
}

function current() {
  return container.querySelector("output")?.textContent ?? "";
}

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

describe("useUrlParam", () => {
  it("reads the value from the URL", () => {
    mocks.params = new URLSearchParams("tab=categories");
    act(() => root.render(<Probe />));
    expect(current()).toBe("categories");
  });

  it("falls back when the URL value is not allowed", () => {
    mocks.params = new URLSearchParams("tab=bogus");
    act(() => root.render(<Probe />));
    expect(current()).toBe("posts");
  });

  it("writes a non-default value with scroll disabled", () => {
    mocks.params = new URLSearchParams("tab=posts");
    act(() => root.render(<Probe />));
    act(() => {
      container
        .querySelectorAll("button")[1]
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(mocks.replace).toHaveBeenCalledWith("/admin/blogs?tab=categories", {
      scroll: false,
    });
  });

  it("removes the param when selecting the fallback", () => {
    act(() => root.render(<Probe />));
    act(() => {
      container
        .querySelectorAll("button")[0]
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(mocks.replace).toHaveBeenCalledWith("/admin/blogs", {
      scroll: false,
    });
  });
});
