"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { RangeSwitch } from "@/features/dashboard/admin/overview/components/range-toggle";
import {
  RANGE_KEYS,
  type RangeKey,
} from "@/features/dashboard/admin/overview/utils/range";
import { useUrlParam } from "@/features/dashboard/admin/shared/hooks/use-url-param";

export function OverviewRangeFilter() {
  const [range, setRange] = useUrlParam<RangeKey>("range", RANGE_KEYS, "day");
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      aria-busy={isPending}
    >
      {isPending ? (
        <span
          role="status"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Updating overview…
        </span>
      ) : null}
      <RangeSwitch
        value={range}
        onChange={(next) => {
          if (next !== range) startTransition(() => setRange(next));
        }}
        disabled={isPending}
        label="Overview reporting period"
      />
    </div>
  );
}
