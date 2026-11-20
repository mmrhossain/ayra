import { cn } from "@/lib/utils";

export function NavbarCountBadge({ count, loading, className }: {
  count: number | null;
  loading: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <span aria-hidden="true" className={cn(
        "absolute size-4 rounded-full bg-muted-foreground/25 motion-safe:animate-pulse",
        className,
      )} />
    );
  }
  if (count === null || count === 0) return null;
  return (
    <span aria-hidden="true" className={cn(
      "absolute grid min-h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-xs font-semibold leading-4 text-white",
      className,
    )}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
