"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LegalTable } from "@/features/dashboard/admin/legal/components/legal-table";
import type {
  LegalListResult,
  LegalType,
} from "@/features/dashboard/admin/legal/types";
import { useUrlParam } from "@/features/dashboard/admin/shared/hooks/use-url-param";

const TAB_KEYS = ["all", "privacy", "terms"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  all: "All",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

const TYPE_BY_TAB: Record<TabKey, LegalType | ""> = {
  all: "",
  privacy: "PRIVACY",
  terms: "TERMS",
};

export function LegalTabs({
  initialData,
}: {
  initialData?: LegalListResult;
}) {
  const [tab, setTab] = useUrlParam<TabKey>("tab", TAB_KEYS, "all");
  const type = TYPE_BY_TAB[tab];

  return (
    <Tabs value={tab} onValueChange={(next) => setTab(next as TabKey)}>
      <TabsList
        aria-label="Legal document types"
        className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1 sm:w-fit"
      >
        {TAB_KEYS.map((key) => (
          <TabsTrigger
            key={key}
            value={key}
            className="min-h-10 shrink-0 rounded-lg px-4 font-medium data-[state=active]:shadow-sm"
          >
            {TAB_LABELS[key]}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent key={tab} value={tab}>
        <LegalTable initialData={initialData} type={type} />
      </TabsContent>
    </Tabs>
  );
}
