import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AddressDeleteDialogProps } from "@/features/dashboard/customer/address/types";

export function AddressDeleteDialog({
  address,
  pending,
  onCancel,
  onConfirm,
}: AddressDeleteDialogProps) {
  return (
    <Dialog
      open={Boolean(address)}
      onOpenChange={(next) => !next && !pending && onCancel()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete address</DialogTitle>
          <DialogDescription>
            {address
              ? `Delete ${address.label ? `"${address.label}"` : "this address"}? This cannot be undone.`
              : "Delete this address?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!address || pending}
            onClick={onConfirm}
          >
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
