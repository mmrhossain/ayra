"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/features/dashboard/admin/shared/hooks/use-debounced-value";

export function DataToolbar({
  initialValue = "",
  onValueChange,
  placeholder,
  searchLabel,
  countLabel,
  filters,
  actions,
  debounceMs = 300,
}: {
  initialValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchLabel: string;
  countLabel?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  debounceMs?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const debounced = useDebouncedValue(value, debounceMs);
  const callback = useRef(onValueChange);
  const mounted = useRef(false);

  useEffect(() => {
    callback.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    // Skip the initial value: the caller's list is already filtered by it, and
    // emitting on mount would reset pagination every time the section remounts
    // (for example when switching away from and back to a tab).
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    callback.current(debounced.trim());
  }, [debounced]);

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={searchLabel}
        className="w-full lg:max-w-sm"
      />
      {filters ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {filters}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
        {countLabel ? (
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
