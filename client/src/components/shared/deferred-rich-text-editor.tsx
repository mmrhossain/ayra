"use client";

import { forwardRef, lazy, Suspense, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const Editor = lazy(() => import("./rich-text-editor").then(module => ({
  default: module.RichTextEditor,
})));
type Props = ComponentProps<typeof import("./rich-text-editor").RichTextEditor>;

export const RichTextEditor = forwardRef<HTMLDivElement, Props>((props, ref) => (
  <Suspense fallback={
    <div
      id={props.id}
      aria-busy="true"
      aria-label="Loading text editor"
      aria-invalid={props["aria-invalid"]}
      aria-describedby={props["aria-describedby"]}
      className={cn(
        "rounded-md border border-input bg-transparent shadow-xs",
        props.variant === "slim" ? "min-h-[155px]" : "min-h-[235px]",
        props.className,
      )}
    />
  }>
    <Editor {...props} ref={ref} />
  </Suspense>
));
RichTextEditor.displayName = "DeferredRichTextEditor";
