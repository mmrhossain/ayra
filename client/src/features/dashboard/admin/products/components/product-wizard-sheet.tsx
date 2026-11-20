"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";

type EditorClose = {
  requestClose: () => void;
  registerGuard: (guard: () => boolean) => () => void;
};
const ProductEditorCloseContext = createContext<EditorClose | null>(null);
export const useProductEditorClose = () => useContext(ProductEditorCloseContext);

export function ProductWizardSheet({ children }: { children: ReactNode }) {
  const router = useRouter();
  const closeGuard = useRef<(() => boolean) | undefined>(undefined);
  const registerGuard = (guard: () => boolean) => {
    closeGuard.current = guard;
    return () => {
      if (closeGuard.current === guard) closeGuard.current = undefined;
    };
  };
  const requestClose = () => {
    if (closeGuard.current && !closeGuard.current()) return;
    router.back();
  };
  const close = { requestClose, registerGuard };

  return (
    <ProductEditorCloseContext.Provider value={close}>
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
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
    </ProductEditorCloseContext.Provider>
  );
}
