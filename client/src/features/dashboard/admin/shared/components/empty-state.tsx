import type { ComponentType, ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  actions,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center">
      {Icon ? <Icon className="size-8 text-muted-foreground" /> : null}
      <p className="text-base font-medium">{title}</p>
      {body ? (
        <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      ) : null}
      {actions ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
