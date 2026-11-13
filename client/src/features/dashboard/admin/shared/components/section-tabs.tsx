"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlParam } from "@/features/dashboard/admin/shared/hooks/use-url-param";

export type TabSection = {
  value: string;
  label: string;
  content: ReactNode;
};

export function SectionTabs({
  sections,
  paramKey = "tab",
  label = "Sections",
}: {
  sections: TabSection[];
  paramKey?: string;
  label?: string;
}) {
  const values = sections.map((section) => section.value);
  const first = values[0] ?? "";
  const [active, setActive] = useUrlParam(paramKey, values, first);

  return (
    <Tabs value={active} onValueChange={(next) => setActive(next)}>
      <TabsList
        aria-label={label}
        className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1 sm:w-fit"
      >
        {sections.map((section) => (
          <TabsTrigger
            key={section.value}
            value={section.value}
            className="min-h-10 shrink-0 rounded-lg px-4 font-medium data-[state=active]:shadow-sm"
          >
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {sections.map((section) => (
        <TabsContent key={section.value} value={section.value}>
          {section.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
