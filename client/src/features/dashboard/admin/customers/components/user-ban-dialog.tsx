"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminUserItem } from "@/features/dashboard/admin/customers/api/customer";
import { useUserBanMutation } from "@/features/dashboard/admin/customers/hooks/use-user-mutations";

export type UserBanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserItem | null;
  ban: boolean;
};

export function UserBanDialog({
  open,
  onOpenChange,
  user,
  ban,
}: UserBanDialogProps) {
  const [banReason, setBanReason] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const action = ban ? "Ban" : "Unban";
  const mutation = useUserBanMutation({
    user,
    ban,
    onSuccess: () => {
      setBanReason("");
      setExpiryDays("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setBanReason("");
          setExpiryDays("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action} user</DialogTitle>
          <DialogDescription>
            {user
              ? ban
                ? `Ban ${user.name} (${user.email})? Active sessions will be revoked.`
                : `Unban ${user.name} (${user.email})?`
              : `${action} this user?`}
          </DialogDescription>
        </DialogHeader>
        {ban ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Reason</Label>
              <Textarea
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Reason (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ban-expiry">Expiry days (optional)</Label>
              <Input
                id="ban-expiry"
                type="number"
                min={1}
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="Leave empty for permanent"
              />
            </div>
          </div>
        ) : null}
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
            variant={ban ? "destructive" : "default"}
            disabled={!user || mutation.isPending}
            onClick={() => mutation.mutate({ banReason, expiryDays })}
          >
            {mutation.isPending
              ? ban
                ? "Banning..."
                : "Unbanning..."
              : action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
