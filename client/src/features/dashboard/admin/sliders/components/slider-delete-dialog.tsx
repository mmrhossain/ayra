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
import { useSliderDeleteMutation } from "@/features/dashboard/admin/sliders/hooks/use-slider-mutations";
import type { SliderDeleteDialogProps } from "@/features/dashboard/admin/sliders/types";

export type { SliderDeleteDialogProps };

export function SliderDeleteDialog({
  open,
  onOpenChange,
  slider,
}: SliderDeleteDialogProps) {
  const mutation = useSliderDeleteMutation({
    slider,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Delete slider</DialogTitle>
          <DialogDescription>
            {slider
              ? `Delete "${slider.title}"? This cannot be undone.`
              : "Delete this slider?"}
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
            variant="destructive"
            disabled={!slider || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
