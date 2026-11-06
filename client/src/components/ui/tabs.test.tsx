import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

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

function renderTabs() {
  act(() => {
    root.render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Sections">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>,
    );
  });
}

describe("Tabs", () => {
  it("renders only the active panel", () => {
    renderTabs();
    const visible = Array.from(
      container.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
    ).filter((panel) => !panel.hasAttribute("hidden"));
    expect(visible).toHaveLength(1);
    expect(visible[0]?.textContent).toBe("Panel A");
  });

  it("switches the visible panel when a trigger is pressed", async () => {
    renderTabs();
    const trigger = Array.from(
      container.querySelectorAll<HTMLElement>('[role="tab"]'),
    ).find((element) => element.textContent === "B");
    expect(trigger).toBeDefined();

    await act(async () => {
      trigger?.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, button: 0 }),
      );
    });

    const visible = Array.from(
      container.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
    ).filter((panel) => !panel.hasAttribute("hidden"));
    expect(visible).toHaveLength(1);
    expect(visible[0]?.textContent).toBe("Panel B");
  });

  it("keeps force-mounted inactive panels in the DOM", () => {
    act(() => {
      root.render(
        <Tabs defaultValue="a">
          <TabsList aria-label="Sections">
            <TabsTrigger value="a">A</TabsTrigger>
            <TabsTrigger value="b">B</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Panel A</TabsContent>
          <TabsContent
            value="b"
            forceMount
            className="data-[state=inactive]:hidden"
          >
            Panel B
          </TabsContent>
        </Tabs>,
      );
    });

    const inactive = container.querySelector<HTMLElement>(
      '[role="tabpanel"][data-state="inactive"]',
    );
    expect(inactive).not.toBeNull();
    expect(inactive?.textContent).toBe("Panel B");
    expect(inactive?.className).toContain("data-[state=inactive]:hidden");
  });
});
