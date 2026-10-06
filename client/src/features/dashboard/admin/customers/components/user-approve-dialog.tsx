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
import type { AdminUserItem } from "@/features/dashboard/admin/customers/api/customer";
import { useUserApproveMutation } from "@/features/dashboard/admin/customers/hooks/use-user-mutations";

export type UserApproveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserItem | null;
  approve: boolean;
};

export function UserApproveDialog({
  open,
  onOpenChange,
  user,
  approve,
}: UserApproveDialogProps) {
  const action = approve ? "Approve" : "Revoke";
  const mutation = useUserApproveMutation({
    user,
    approve,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action} user</DialogTitle>
          <DialogDescription>
            {user
              ? approve
                ? `Approve ${user.name} (${user.email})?`
                : `Revoke approval for ${user.name} (${user.email})?`
              : `${action} this user?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
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
            variant={approve ? "default" : "destructive"}
            disabled={!user || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? `${action.slice(0, -1)}ing...` : action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
