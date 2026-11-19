"use client";

import { useQuery } from "@tanstack/react-query";

import type { AdminSettingGroup } from "@/features/dashboard/admin/settings/types";
import {
  ADMIN_SETTINGS_QUERY_KEY,
  fetchAdminSettings,
} from "@/features/dashboard/admin/settings/api/settings";
import { SettingsTabs } from "@/features/dashboard/admin/settings/components/settings-tabs";

export function SettingsPageContent({ initialData }: { initialData: AdminSettingGroup[] }) {
  const query = useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEY,
    queryFn: fetchAdminSettings,
    initialData,
    staleTime: 30_000,
  });

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
