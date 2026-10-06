"use client";

import { useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CouponPickerOption = {
  id: string;
  label: string;
  hint?: string;
};

type CouponIdPickerProps = {
  options: CouponPickerOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  emptyLabel: string;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  onSearchChange?: (query: string) => void;
};

export function CouponIdPicker({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel,
  disabled,
  loading,
  searchable = true,
  onSearchChange,
}: CouponIdPickerProps) {
  const [query, setQuery] = useState("");
  const selected = new Set(value);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (onSearchChange || !q) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(q) ||
        option.hint?.toLowerCase().includes(q),
    );
  }, [onSearchChange, options, query]);

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      if (selected.has(id)) return;
      onChange([...value, id]);
      return;
    }
    onChange(value.filter((item) => item !== id));
  };

  return (
    <div className="space-y-2">
      {searchable ? (
        <Input
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onSearchChange?.(next);
          }}
        />
      ) : null}
      <div
        className={cn(
          "max-h-44 space-y-1 overflow-y-auto rounded-md border p-2",
          disabled && "opacity-50",
        )}
      >
        {loading ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          visible.map((option) => {
            const checked = selected.has(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 hover:bg-muted/60"
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(state) =>
                    toggle(option.id, state === true)
                  }
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block text-sm leading-5">{option.label}</span>
                  {option.hint ? (
                    <span className="block text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })
        )}
      </div>
      {value.length > 0 ? (
        <p className="text-xs text-muted-foreground">{value.length} selected</p>
      ) : null}
    </div>
  );
}
