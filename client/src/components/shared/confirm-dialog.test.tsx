import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

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

const getDialog = () => document.querySelector('[role="dialog"]');

const getButton = (label: string) =>
  Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent === label,
  );

describe("ConfirmDialog", () => {
  it("renders title, description and default labels when open", () => {
    act(() =>
      root.render(
        <ConfirmDialog
          open
          onOpenChange={() => {}}
          title="Delete address"
          description="This cannot be undone."
          onConfirm={() => {}}
        />,
      ),
    );

    const dialog = getDialog();
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain("Delete address");
    expect(dialog?.textContent).toContain("This cannot be undone.");
    expect(getButton("Confirm")).toBeDefined();
    expect(getButton("Cancel")).toBeDefined();
  });

  it("swaps the confirm label for the pending label while busy", () => {
    act(() =>
      root.render(
        <ConfirmDialog
          open
          pending
          onOpenChange={() => {}}
          title="Delete address"
          confirmLabel="Delete"
          pendingLabel="Deleting..."
          onConfirm={() => {}}
        />,
      ),
    );

    expect(getButton("Deleting...")).toBeDefined();
    expect(getButton("Delete")).toBeUndefined();
    expect(getButton("Cancel")?.disabled).toBe(true);
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    const onConfirm = vi.fn();
    act(() =>
      root.render(
        <ConfirmDialog
          open
          onOpenChange={() => {}}
          title="Delete address"
          confirmLabel="Delete"
          onConfirm={onConfirm}
        />,
      ),
    );

    const confirmButton = getButton("Delete");
    expect(confirmButton).toBeDefined();

    act(() => confirmButton?.click());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
