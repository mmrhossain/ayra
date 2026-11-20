"use client";

import { useDeferredValue, useEffect, useRef, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";

export function DataToolbar({
  initialValue = "",
  onValueChange,
  placeholder,
  searchLabel,
  countLabel,
  filters,
  actions,
}: {
  initialValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchLabel: string;
  countLabel?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  const [value, setValue] = useState(initialValue);
  const deferredValue = useDeferredValue(value.trim());
  const callback = useRef(onValueChange);
  const lastValue = useRef(initialValue.trim());

  useEffect(() => {
    callback.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    // Skip the initial value: the caller's list is already filtered by it, and
    // emitting on mount would reset pagination every time the section remounts
    // (for example when switching away from and back to a tab).
    if (lastValue.current === deferredValue) return;
    lastValue.current = deferredValue;
    callback.current(deferredValue);
  }, [deferredValue]);

  return (
    <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={searchLabel}
        className="w-full xl:w-auto xl:min-w-48 xl:flex-1 xl:max-w-sm"
      />
      {filters ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {filters}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
        {countLabel ? (
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
