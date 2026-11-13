"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function ProductWizardSheet({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-4 pt-16 sm:max-w-5xl sm:p-8 sm:pt-16"
      >
        <SheetTitle className="sr-only">Product editor</SheetTitle>
        <SheetDescription className="sr-only">
          Create or edit product details, variants, and stock.
        </SheetDescription>
        {children}
      </SheetContent>
    </Sheet>
  );
}
