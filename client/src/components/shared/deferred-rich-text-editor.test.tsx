import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
vi.mock("./rich-text-editor", async () => {
  const React = await import("react");
  return { RichTextEditor: React.forwardRef<HTMLDivElement, { value: string; onChange: (value: string) => void }>(
    function MockEditor({ value, onChange }, ref) { return <div ref={ref} data-editor><span>{value}</span><button onClick={() => onChange("<p>Updated</p>")}>Edit</button></div>; },
  ) };
});
import { RichTextEditor } from "./deferred-rich-text-editor";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it("retains controlled values, change handlers, and refs after lazy loading", async () => {
  const container = document.createElement("div"); document.body.appendChild(container);
  const root = createRoot(container); const ref = createRef<HTMLDivElement>(); const change = vi.fn();
  try {
    act(() => root.render(<RichTextEditor ref={ref} value="<p>Saved</p>" onChange={change} />));
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    await act(async () => { await import("./rich-text-editor"); });
    expect(ref.current).toBe(container.querySelector("[data-editor]"));
    expect(container.textContent).toContain("<p>Saved</p>");
    act(() => root.render(<RichTextEditor ref={ref} value="<p>Latest</p>" onChange={change} />));
    expect(container.textContent).toContain("<p>Latest</p>");
    expect(change).not.toHaveBeenCalled();
    act(() => container.querySelector("button")!.click());
    expect(change).toHaveBeenCalledExactlyOnceWith("<p>Updated</p>");
  } finally { act(() => root.unmount()); container.remove(); }
});
