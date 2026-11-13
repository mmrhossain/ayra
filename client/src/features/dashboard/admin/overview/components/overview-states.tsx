import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function SkeletonCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-xl border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function HeadlineSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-3.5 w-full max-w-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonCard key={index} className="py-6">
            <div className="space-y-3 px-6">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-32" />
              {index === 1 ? <Skeleton className="h-3 w-full" /> : null}
            </div>
          </SkeletonCard>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-4"
          >
            <Skeleton className="size-5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <SkeletonCard className="flex h-full flex-col gap-6 overflow-hidden py-6">
      <div className="space-y-4 px-6 pb-2">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-xl border bg-muted/30 px-4 py-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="min-w-0 space-y-1.5">
              <Skeleton className="h-3 w-16 max-w-full" />
              <Skeleton className="h-6 w-24 max-w-full" />
              <Skeleton className="h-3 w-16 max-w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 space-y-3 px-6">
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="flex h-[260px] items-end justify-between gap-2 pt-4 sm:h-[300px] sm:gap-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <Skeleton
                className="w-full rounded-t-sm"
                style={{
                  height: `${[40, 65, 30, 85, 50, 75, 60, 90, 45, 70, 55, 80][index]}%`,
                }}
              />
              <Skeleton className="h-3 w-7" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <Skeleton className="h-3 w-48 max-w-full" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
}

function WidgetHeader() {
  return (
    <div className="grid auto-rows-min grid-cols-[1fr_auto] items-start gap-1.5 px-6">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="col-start-2 row-span-2 row-start-1 h-8 w-16" />
      <Skeleton className="h-3.5 w-52 max-w-full" />
    </div>
  );
}

export function RecentOrdersSkeleton() {
  return (
    <SkeletonCard className="flex h-full flex-col gap-6 py-6">
      <WidgetHeader />
      <div className="px-6">
        <ul className="divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, index) => (
            <li
              key={index}
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-2 py-2.5"
            >
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="h-3 w-32 max-w-full" />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 max-sm:w-full max-sm:flex-row max-sm:items-center max-sm:justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SkeletonCard>
  );
}

export function OrdersStatusSkeleton() {
  return (
    <SkeletonCard className="flex h-full flex-col gap-6 py-6">
      <div className="grid auto-rows-min gap-1.5 px-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="grid grid-cols-1 gap-3 px-6 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

export function TopProductsSkeleton() {
  return (
    <SkeletonCard className="flex h-full flex-col gap-6 py-6">
      <div className="grid auto-rows-min gap-1.5 px-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      <div className="overflow-x-auto px-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="h-10 text-left">
                <Skeleton className="ml-3 h-3 w-16" />
              </th>
              {Array.from({ length: 3 }).map((_, index) => (
                <th key={index} className="h-10 text-right">
                  <Skeleton className="ml-auto mr-3 h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index} className="border-b">
                <td className="p-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40 max-w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </td>
                {Array.from({ length: 3 }).map((_, cellIndex) => (
                  <td key={cellIndex} className="p-3">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SkeletonCard>
  );
}

export function DetailedMetricsSkeleton() {
  return (
    <div
      className="flex min-w-0 items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
      aria-busy="true"
    >
      <Skeleton className="h-4 w-48 max-w-full" />
      <Skeleton className="size-4 shrink-0" />
    </div>
  );
}

export function OverviewPageSkeleton() {
  return (
    <section className="min-w-0 space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading admin overview</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <HeadlineSkeleton />
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <RecentOrdersSkeleton />
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <OrdersStatusSkeleton />
        <TopProductsSkeleton />
      </div>
      <DetailedMetricsSkeleton />
    </section>
  );
}

export function OverviewError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6"
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <h2 className="text-base font-semibold leading-snug">
          Could not load overview
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">{message}</p>

      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
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
