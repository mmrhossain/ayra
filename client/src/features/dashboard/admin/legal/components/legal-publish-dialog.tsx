"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLegalPublishMutation } from "@/features/dashboard/admin/legal/hooks/use-legal-mutations";
import type { LegalPublishDialogProps } from "@/features/dashboard/admin/legal/types";
import { legalTypeLabel } from "@/features/dashboard/admin/legal/utils";

export type { LegalPublishDialogProps };

export function LegalPublishDialog({
  open,
  onOpenChange,
  document,
}: LegalPublishDialogProps) {
  const mutation = useLegalPublishMutation({
    document,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Publish document</DialogTitle>
          <DialogDescription>
            {document
              ? `Publish ${legalTypeLabel(document.type)} v${document.version}? The current published version will be archived.`
              : "Publish this document?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!document || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
