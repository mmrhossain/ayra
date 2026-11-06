"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useInviteStaff } from "@/features/dashboard/admin/staff/hooks/use-staff";
import {
  ADMIN_ACTIONS,
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_LABELS,
  EXPLICIT_ONLY_ACTIONS,
  type AdminAction,
  type AdminPermission,
} from "@/lib/admin-permissions";
import { ACTION_LABELS } from "@/features/dashboard/admin/staff/utils";

export function StaffInviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const mutation = useInviteStaff();

  const reset = () => {
    setEmail("");
    setName("");
    setPermissions([]);
    setActions([]);
    setIsSuperAdmin(false);
    setInviteUrl(null);
  };

  const toggle = <T extends string>(
    value: T,
    list: T[],
    setList: (next: T[]) => void,
    checked: boolean,
  ) => {
    setList(checked ? [...new Set([...list, value])] : list.filter((item) => item !== value));
  };

  const submit = () => {
    mutation.mutate(
      {
        email: email.trim(),
        name: name.trim(),
        permissions: isSuperAdmin ? [] : permissions,
        isSuperAdmin,
      },
      {
        onSuccess: (result) => {
          if (result.token) {
            setInviteUrl(
              `${window.location.origin}/accept-invitation?token=${encodeURIComponent(result.token)}`,
            );
          }
          reset();
          if (!result.token) onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Invite staff</DialogTitle>
          <DialogDescription>
            The recipient sets their own password from an emailed link. Privileges
            are applied only after they accept.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
          <div className="space-y-2">
            <Label htmlFor="staff-invite-name">Name</Label>
            <Input
              id="staff-invite-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-invite-email">Email</Label>
            <Input
              id="staff-invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jane@example.com"
            />
          </div>

          <Label className="justify-start font-normal">
            <Checkbox
              checked={isSuperAdmin}
              onCheckedChange={(checked) => {
                setIsSuperAdmin(checked === true);
                if (checked === true) {
                  setPermissions([]);
                  setActions([]);
                }
              }}
            />
            Full super-admin access
          </Label>

          {!isSuperAdmin ? (
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-sm font-medium">Dashboard areas</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ADMIN_PERMISSIONS.map((permission) => (
                    <Label key={permission} className="justify-start font-normal">
                      <Checkbox
                        checked={permissions.includes(permission)}
                        onCheckedChange={(checked) =>
                          toggle(permission, permissions, setPermissions, checked === true)
                        }
                      />
                      {ADMIN_PERMISSION_LABELS[permission]}
                    </Label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Sensitive actions</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ADMIN_ACTIONS.filter((action) =>
                    EXPLICIT_ONLY_ACTIONS.includes(action),
                  ).map((action) => (
                    <Label key={action} className="justify-start font-normal">
                      <Checkbox
                        checked={actions.includes(action)}
                        onCheckedChange={(checked) =>
                          toggle(action, actions, setActions, checked === true)
                        }
                      />
                      {ACTION_LABELS[action]}
                    </Label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {inviteUrl ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
              <p className="font-medium">Email delivery is not configured.</p>
              <p className="mt-1 break-all text-muted-foreground">{inviteUrl}</p>
            </div>
          ) : null}
        </div>

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
            onClick={submit}
            disabled={mutation.isPending || !email.trim() || !name.trim()}
          >
            {mutation.isPending ? "Sending..." : "Send invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
