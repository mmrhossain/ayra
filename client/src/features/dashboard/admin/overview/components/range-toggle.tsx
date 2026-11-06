"use client";

import { Button } from "@/components/ui/button";
import {
  RANGE_KEYS,
  RANGE_LABELS,
  type RangeKey,
} from "@/features/dashboard/admin/overview/utils/range";

export function RangeSwitch({
  value,
  onChange,
  disabled = false,
  label = "Reporting period",
}: {
  value: RangeKey;
  onChange: (next: RangeKey) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex w-fit items-center rounded-lg border bg-muted p-1"
    >
      {RANGE_KEYS.map((key) => (
        <Button
          key={key}
          type="button"
          size="sm"
          variant={value === key ? "default" : "ghost"}
          aria-pressed={value === key}
          disabled={disabled}
          className="h-7 px-2.5"
          onClick={() => onChange(key)}
        >
          {RANGE_LABELS[key]}
        </Button>
      ))}
    </div>
  );
}
