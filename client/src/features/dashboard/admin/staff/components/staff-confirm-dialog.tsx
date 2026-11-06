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
import type { StaffMember } from "@/features/dashboard/admin/staff/types/models";

const COPY = {
  suspend: {
    title: "Suspend staff member",
    description:
      "They lose dashboard access immediately and every existing session is revoked. You can reactivate them later, but their access will start empty.",
    confirm: "Suspend",
    variant: "outline" as const,
  },
  reactivate: {
    title: "Reactivate staff member",
    description:
      "Their account becomes active again with no dashboard access. Assign permissions afterwards.",
    confirm: "Reactivate",
    variant: "default" as const,
  },
  offboard: {
    title: "Offboard staff member",
    description:
      "Staff access is removed and the account becomes a normal customer account. Historical orders, inventory and audit records are kept.",
    confirm: "Offboard",
    variant: "destructive" as const,
  },
};

export function StaffConfirmDialog({
  action,
  isPending,
  onCancel,
  onConfirm,
}: {
  action: { kind: "suspend" | "reactivate" | "offboard"; member: StaffMember } | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action) {
    return (
      <Dialog open={false} onOpenChange={() => undefined}>
        <DialogContent />
      </Dialog>
    );
  }

  const copy = COPY[action.kind];

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {action.member.name} ({action.member.email}). {copy.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={copy.variant}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Working..." : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
