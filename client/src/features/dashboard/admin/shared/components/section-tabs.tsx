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
      <TabsList aria-label={label}>
        {sections.map((section) => (
          <TabsTrigger key={section.value} value={section.value}>
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
