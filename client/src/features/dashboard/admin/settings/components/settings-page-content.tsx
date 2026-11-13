"use client";

import { useQuery } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import {
  ADMIN_SETTINGS_QUERY_KEY,
  fetchAdminSettings,
} from "@/features/dashboard/admin/settings/api/settings";
import { SettingsTabs } from "@/features/dashboard/admin/settings/components/settings-tabs";

function SettingsLoading() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading settings">
      <div className="flex gap-2 rounded-xl border bg-muted/30 p-1 sm:w-fit">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-lg" />
        ))}
      </div>
      <div className="space-y-6 rounded-xl border bg-card p-5 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

export function SettingsPageContent() {
  const query = useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEY,
    queryFn: fetchAdminSettings,
    staleTime: 30_000,
  });

  if (query.isPending) return <SettingsLoading />;
  if (query.isError || !query.data) {
    const message = query.error instanceof Error
      ? query.error.message
      : "Settings data is unavailable";

    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
      >
        <h2 className="font-medium">Could not load settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  return <SettingsTabs groups={query.data} />;
}
