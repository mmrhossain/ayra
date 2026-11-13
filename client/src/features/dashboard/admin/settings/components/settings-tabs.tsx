"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsGroupCard } from "@/features/dashboard/admin/settings/components/settings-group-card";
import type { AdminSettingGroup } from "@/features/dashboard/admin/settings/types";
import { useUrlParam } from "@/features/dashboard/admin/shared/hooks/use-url-param";

const GROUP_KEYS = ["store", "payment", "checkout"] as const;
type GroupKey = (typeof GROUP_KEYS)[number];

export function SettingsTabs({ groups }: { groups: AdminSettingGroup[] }) {
  const [requested, setTab] = useUrlParam<GroupKey>("tab", GROUP_KEYS, "store");
  const available = groups.map((group) => group.key as GroupKey);
  const tab = available.includes(requested)
    ? requested
    : (available[0] ?? "store");

  const ordered = [...groups].sort(
    (a, b) =>
      GROUP_KEYS.indexOf(a.key as GroupKey) -
      GROUP_KEYS.indexOf(b.key as GroupKey),
  );

  return (
    <Tabs value={tab} onValueChange={(next) => setTab(next as GroupKey)}>
      <TabsList
        aria-label="Settings sections"
        className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1 sm:w-fit"
      >
        {ordered.map((group) => (
          <TabsTrigger
            key={group.key}
            value={group.key}
            className="min-h-10 shrink-0 rounded-lg px-4 font-medium data-[state=active]:shadow-sm"
          >
            {group.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {ordered.map((group) => (
        <TabsContent
          key={group.key}
          value={group.key}
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <SettingsGroupCard group={group} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
