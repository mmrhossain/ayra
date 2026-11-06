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
import { Label } from "@/components/ui/label";
import { useUpdateStaffAccess } from "@/features/dashboard/admin/staff/hooks/use-staff";
import type { StaffMember } from "@/features/dashboard/admin/staff/types/models";
import { ACTION_LABELS } from "@/features/dashboard/admin/staff/utils";
import {
  ADMIN_ACTIONS,
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_LABELS,
  EXPLICIT_ONLY_ACTIONS,
  type AdminAction,
  type AdminPermission,
} from "@/lib/admin-permissions";

function AccessForm({
  member,
  onOpenChange,
}: {
  member: StaffMember;
  onOpenChange: (open: boolean) => void;
}) {
  const [permissions, setPermissions] = useState<AdminPermission[]>(
    member.adminPermissions,
  );
  const [actions, setActions] = useState<AdminAction[]>(
    member.adminActions ?? [],
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(member.isSuperAdmin);

  const mutation = useUpdateStaffAccess(() => onOpenChange(false));

  const toggle = <T extends string>(
    value: T,
    list: T[],
    setList: (next: T[]) => void,
    checked: boolean,
  ) => {
    setList(checked ? [...new Set([...list, value])] : list.filter((item) => item !== value));
  };

  return (
    <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
      <DialogHeader className="shrink-0">
        <DialogTitle>Edit access</DialogTitle>
        <DialogDescription>
          Choose what {member.name} can access. Saving signs them out of existing
          sessions.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
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
            {permissions.length === 0 && actions.length === 0 ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                No permissions selected means this account has no dashboard access
                at all.
              </p>
            ) : null}
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
          disabled={mutation.isPending}
          onClick={() => {
            mutation.mutate({
              id: member.id,
              input: {
                permissions: isSuperAdmin ? [] : permissions,
                actions: isSuperAdmin ? [] : actions,
                isSuperAdmin,
              },
            });
          }}
        >
          {mutation.isPending ? "Saving..." : "Save access"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function StaffAccessDialog({
  member,
  onOpenChange,
}: {
  member: StaffMember | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={member !== null} onOpenChange={onOpenChange}>
      {member ? (
        <AccessForm
          key={member.id}
          member={member}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}
