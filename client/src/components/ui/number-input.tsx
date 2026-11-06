"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as React from "react";

type NumberInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "type"
> & {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  decimal?: boolean;
  allowNegative?: boolean;
};

function sanitizeNumeric(raw: string, decimal: boolean, allowNegative: boolean): string {
  let next = raw.replace(decimal ? /[^\d.-]/g : /[^\d-]/g, "");

  if (allowNegative) {
    const negative = next.startsWith("-");
    next = next.replace(/-/g, "");
    if (negative) next = `-${next}`;
  } else {
    next = next.replace(/-/g, "");
  }

  if (decimal) {
    const dot = next.indexOf(".");
    if (dot !== -1) {
      next = `${next.slice(0, dot + 1)}${next.slice(dot + 1).replace(/\./g, "")}`;
    }
  }

  return next;
}

function draftFromValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return String(value);
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, decimal = false, allowNegative = false, className, ...props }, ref) => {
    const [draft, setDraft] = React.useState(() => draftFromValue(value));

    React.useEffect(() => {
      setDraft((prev) => {
        if (value === null || value === undefined || Number.isNaN(value)) {
          return prev === "" ? prev : "";
        }
        if (prev === "") return String(value);
        const parsed = Number(prev);
        return Number.isFinite(parsed) && parsed === value ? prev : String(value);
      });
    }, [value]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = sanitizeNumeric(event.target.value, decimal, allowNegative);
      setDraft(next);
      if (next === "" || next === "-" || next === "." || next === "-.") {
        onChange(null);
        return;
      }
      const parsed = Number(next);
      onChange(Number.isFinite(parsed) ? parsed : null);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete="off"
        value={draft}
        onChange={handleChange}
        className={cn("h-9", className)}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
