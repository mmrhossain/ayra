import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RotateCcw } from "lucide-react";

// 1. Metrics Grid Skeleton
export function MetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 2. Sales Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="h-[280px] flex items-end justify-between gap-3 pt-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <Skeleton
              className="w-full rounded-t-sm"
              style={{ height: `${[40, 65, 30, 85, 50, 75, 60, 90, 45, 70, 55, 80][i]}%` }}
            />
            <Skeleton className="h-3 w-7" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Widget Skeleton (Orders & Top Products)
export function WidgetSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3.5 w-52" />
      </div>

      <div className="space-y-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Combined Fallback Skeleton
export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <MetricsSkeleton />
      <ChartSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetSkeleton />
        <WidgetSkeleton />
      </div>
    </div>
  );
}

// 5. Error Component with Retry Form Action
interface OverviewErrorProps {
  message: string;
  onRetry?: () => void;
}

export function OverviewError({ message, onRetry }: OverviewErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3"
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <h2 className="text-base font-semibold leading-none">Could not load overview</h2>
      </div>

      <p className="text-sm text-muted-foreground">{message}</p>

      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </Button>
      ) : (
        <form className="mt-2">
          <Button type="submit" variant="outline" size="sm">
            Retry
          </Button>
        </form>
      )}
    </div>
  );
}
