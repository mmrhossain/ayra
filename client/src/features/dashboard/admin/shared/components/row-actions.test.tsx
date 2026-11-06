import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RowActions, splitRowActions } from "./row-actions";

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: ({ href, children }: { href: string; children: React.ReactNode }) =>
      React.createElement("a", { href }, children),
  };
});

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

describe("splitRowActions", () => {
  it("puts every destructive action last", () => {
    const result = splitRowActions([
      { label: "Edit" },
      { label: "Delete", variant: "destructive" },
      { label: "Archive", variant: "destructive" },
    ]);
    expect(result.primary.map((action) => action.label)).toEqual(["Edit"]);
    expect(result.destructive.map((action) => action.label)).toEqual([
      "Delete",
      "Archive",
    ]);
  });

  it("returns an empty destructive list when nothing is destructive", () => {
    const result = splitRowActions([{ label: "View" }]);
    expect(result.primary).toHaveLength(1);
    expect(result.destructive).toHaveLength(0);
  });
});

describe("RowActions", () => {
  it("labels the trigger with the row it belongs to", () => {
    act(() =>
      root.render(
        <RowActions label="Actions for Rahim" actions={[{ label: "Edit" }]} />,
      ),
    );
    const trigger = container.querySelector("button");
    expect(trigger?.getAttribute("aria-label")).toBe("Actions for Rahim");
    expect(trigger?.hasAttribute("disabled")).toBe(false);
  });

  it("renders a disabled trigger when there are no actions", () => {
    act(() => root.render(<RowActions label="Actions for you" actions={[]} />));
    expect(container.querySelector("button")?.hasAttribute("disabled")).toBe(
      true,
    );
  });

  it("exposes a menu trigger with the row label", () => {
    act(() =>
      root.render(
        <RowActions label="Actions for Rahim" actions={[{ label: "Edit" }]} />,
      ),
    );
    const trigger = container.querySelector("button");
    expect(trigger?.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  });
});
