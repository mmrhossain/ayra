"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useResendInvitation,
  useRevokeInvitation,
  useStaffInvitations,
} from "@/features/dashboard/admin/staff/hooks/use-staff";
import {
  permissionLabels,
  toStaffErrorMessage,
} from "@/features/dashboard/admin/staff/utils";

export function StaffInvitationsPanel() {
  const query = useStaffInvitations();
  const resend = useResendInvitation();
  const revoke = useRevokeInvitation();

  if (query.isLoading) {
    return (
      <div className="space-y-2 rounded-xl border p-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div role="alert" className="rounded-xl border border-destructive/30 p-4">
        <p className="text-sm">{toStaffErrorMessage(query.error)}</p>
      </div>
    );
  }

  const invitations = query.data?.items ?? [];

  return (
    <div className="rounded-xl border">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Invitations</h2>
        <p className="text-xs text-muted-foreground">
          Pending, accepted, revoked and expired staff invitations.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invitee</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-20 text-center">
                No invitations yet.
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invitation.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {invitation.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {invitation.isSuperAdmin ? (
                    <StatusBadge variant="success">Full access</StatusBadge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {permissionLabels(invitation.permissions).join(", ") ||
                        "No access"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    variant={
                      invitation.status === "PENDING"
                        ? "warning"
                        : invitation.status === "ACCEPTED"
                          ? "success"
                          : invitation.status === "REVOKED"
                            ? "danger"
                            : "neutral"
                    }
                  >
                    {invitation.status}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  {invitation.status === "PENDING" ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={resend.isPending}
                        onClick={() => resend.mutate(invitation.id)}
                      >
                        Resend
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(invitation.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
