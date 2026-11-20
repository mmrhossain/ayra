"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { RangeSwitch } from "@/features/dashboard/admin/overview/components/range-toggle";
import {
  RANGE_KEYS,
  type RangeKey,
} from "@/features/dashboard/admin/overview/utils/range";
import { useUrlParam } from "@/features/dashboard/admin/shared/hooks/use-url-param";

export function OverviewRangeFilter({ disabled = false }: { disabled?: boolean }) {
  const [range, setRange] = useUrlParam<RangeKey>("range", RANGE_KEYS, "day");
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="relative flex w-full min-w-0 items-center justify-end sm:w-auto"
      aria-busy={isPending}
    >
      {isPending ? (
        <span
          role="status"
          className="absolute right-0 top-full mt-1 inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground"
        >
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
          Updating overview…
        </span>
      ) : null}
      <RangeSwitch
        value={range}
        onChange={(next) => {
          if (next !== range) startTransition(() => setRange(next));
        }}
        disabled={disabled || isPending}
        label="Overview reporting period"
      />
    </div>
  );
}
