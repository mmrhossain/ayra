import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminSettingGroup } from "@/features/dashboard/admin/settings/types";

import { SettingsTabs } from "./settings-tabs";

// Stateful navigation mock: `setTab` calls `router.replace`, and `useUrlParam`
// reads `useSearchParams`. Without updating the fake URL the controlled Tabs
// value would never change and the test would not exercise a real tab switch.
const nav = vi.hoisted(() => {
  const state = { params: new URLSearchParams("tab=store") };
  const replace = vi.fn((url: string) => {
    state.params = new URLSearchParams(url.split("?")[1] ?? "");
  });
  return { state, replace };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/admin/settings",
  useSearchParams: () => nav.state.params,
}));

vi.mock("@/features/dashboard/admin/settings/components/settings-group-card", async () => {
  const React = await import("react");
  return {
    SettingsGroupCard: ({ group }: { group: AdminSettingGroup }) => {
      const [value, setValue] = React.useState("");
      return React.createElement("input", {
        "aria-label": group.label,
        value,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
          setValue(event.target.value),
      });
    },
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GROUPS: AdminSettingGroup[] = [
  { key: "store", label: "Store", description: "", fields: [] },
  { key: "payment", label: "Payment", description: "", fields: [] },
  { key: "checkout", label: "Checkout", description: "", fields: [] },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  nav.state.params = new URLSearchParams("tab=store");
  nav.replace.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function typeInto(label: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(
    `input[aria-label="${label}"]`,
  )!;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("SettingsTabs", () => {
  it("renders one tab per group", () => {
    act(() => root.render(<SettingsTabs groups={GROUPS} />));
    expect(
      Array.from(container.querySelectorAll('[role="tab"]')).map(
        (tab) => tab.textContent,
      ),
    ).toEqual(["Store", "Payment", "Checkout"]);
  });

  it("keeps typed values when switching tabs", () => {
    act(() => root.render(<SettingsTabs groups={GROUPS} />));

    typeInto("Store", "Ayra");
    expect(
      container.querySelector<HTMLInputElement>('input[aria-label="Store"]')
        ?.value,
    ).toBe("Ayra");

    const paymentTab = Array.from(
      container.querySelectorAll<HTMLElement>('[role="tab"]'),
    ).find((tab) => tab.textContent === "Payment")!;
    act(() => {
      paymentTab.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, button: 0 }),
      );
    });

    // The router mock is not reactive, so re-render once to pick up the URL the
    // click just wrote, exactly like a Next navigation would.
    expect(nav.state.params.get("tab")).toBe("payment");
    act(() => root.render(<SettingsTabs groups={GROUPS} />));

    const selected = container.querySelector<HTMLElement>(
      '[role="tab"][aria-selected="true"]',
    );
    expect(selected?.textContent).toBe("Payment");

    // All three panels stay mounted (forceMount); inactive ones are only hidden,
    // so the Store card keeps its unsaved value across the switch.
    const storeInput = container.querySelector<HTMLInputElement>(
      'input[aria-label="Store"]',
    );
    expect(storeInput).not.toBeNull();
    expect(storeInput?.value).toBe("Ayra");
  });
});
