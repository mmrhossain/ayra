"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toStaffErrorMessage } from "@/features/dashboard/admin/staff/api/staff";
import { StaffAccessDialog } from "@/features/dashboard/admin/staff/components/staff-access-dialog";
import { StaffConfirmDialog } from "@/features/dashboard/admin/staff/components/staff-confirm-dialog";
import { StaffInviteDialog } from "@/features/dashboard/admin/staff/components/staff-invite-dialog";
import { StaffInvitationsPanel } from "@/features/dashboard/admin/staff/components/staff-invitations-panel";
import {
  useOffboardStaff,
  useReactivateStaff,
  useStaffList,
  useSuspendStaff,
} from "@/features/dashboard/admin/staff/hooks/use-staff";
import type {
  StaffListResult,
  StaffMember,
  StaffStatus,
} from "@/features/dashboard/admin/staff/types/models";
import {
  statusLabel,
  statusVariant,
} from "@/features/dashboard/admin/staff/utils";
import { EmptyState } from "@/features/dashboard/admin/shared/components/empty-state";
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";
import { RowActions } from "@/features/dashboard/admin/shared/components/row-actions";
import { ADMIN_PERMISSION_LABELS } from "@/lib/admin-permissions";

type Props = {
  initialData: StaffListResult;
};

type PendingAction = {
  kind: "suspend" | "reactivate" | "offboard";
  member: StaffMember;
} | null;

export function StaffTable({ initialData }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StaffStatus | "">("");
  const [accessTarget, setAccessTarget] = useState<StaffMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const { query, data } = useStaffList({
    initialData,
    params: {
      page,
      limit: 20,
      search: search.trim() || undefined,
      status: status || undefined,
    },
  });

  const suspend = useSuspendStaff(() => setPendingAction(null));
  const reactivate = useReactivateStaff(() => setPendingAction(null));
  const offboard = useOffboardStaff(() => setPendingAction(null));

  const confirmMutation =
    pendingAction?.kind === "suspend"
      ? suspend
      : pendingAction?.kind === "reactivate"
        ? reactivate
        : offboard;

  const runConfirmedAction = () => {
    if (!pendingAction) return;
    if (pendingAction.kind === "suspend") suspend.mutate(pendingAction.member.id);
    if (pendingAction.kind === "reactivate") {
      reactivate.mutate(pendingAction.member.id);
    }
    if (pendingAction.kind === "offboard") {
      offboard.mutate(pendingAction.member.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            aria-label="Search staff"
            className="w-full sm:max-w-64"
          />
          <Select
            value={status || "__all__"}
            onValueChange={(value) => {
              setStatus(value === "__all__" ? "" : (value as StaffStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="OFFBOARDED">Offboarded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.canManage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInvitations((current) => !current)}
            >
              {showInvitations ? "Hide invitations" : "Invitations"}
            </Button>
          ) : null}
          {data.canInvite ? (
            <Button type="button" size="sm" onClick={() => setInviteOpen(true)}>
              Invite staff
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {data.pagination.total} staff account
        {data.pagination.total === 1 ? "" : "s"}
      </p>

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toStaffErrorMessage(query.error)}</p>
        </div>
      ) : null}

      {data.canManage && showInvitations ? <StaffInvitationsPanel /> : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      title="No staff accounts found"
                      body="Invite a teammate to give them dashboard access."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((member) => {
                  const isSelf = member.id === data.currentUserId;
                  return (
                    <TableRow key={member.id}>
                      <TableCell data-label="Staff">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {member.name}
                            {isSelf ? " (you)" : ""}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {member.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-label="Access">
                        {member.isSuperAdmin ? (
                          <StatusBadge variant="success">Full access</StatusBadge>
                        ) : member.adminPermissions.length === 0 ? (
                          <StatusBadge variant="neutral">No access</StatusBadge>
                        ) : (
                          <div className="flex max-w-md flex-wrap gap-1">
                            {member.adminPermissions.map((permission) => (
                              <StatusBadge key={permission} variant="neutral">
                                {ADMIN_PERMISSION_LABELS[permission] ?? permission}
                              </StatusBadge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell data-label="Status">
                        <StatusBadge variant={statusVariant(member.status)}>
                          {statusLabel(member.status)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground" data-label="Added">
                        {new Date(member.createdAt).toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell className="text-right" data-label="Actions">
                        <RowActions
                          label={`Actions for ${member.name}`}
                          actions={[
                            ...(data.canManage && !isSelf
                              ? [
                                  {
                                    label: "Manage access",
                                    onSelect: () => setAccessTarget(member),
                                  },
                                ]
                              : []),
                            ...(data.canSuspend &&
                            !isSelf &&
                            member.status === "ACTIVE"
                              ? [
                                  {
                                    label: "Suspend",
                                    onSelect: () =>
                                      setPendingAction({ kind: "suspend", member }),
                                  },
                                ]
                              : []),
                            ...(data.canSuspend &&
                            !isSelf &&
                            (member.status === "SUSPENDED" ||
                              member.status === "OFFBOARDED")
                              ? [
                                  {
                                    label: "Reactivate",
                                    onSelect: () =>
                                      setPendingAction({
                                        kind: "reactivate",
                                        member,
                                      }),
                                  },
                                ]
                              : []),
                            ...(data.canManage &&
                            !isSelf &&
                            member.role !== "CUSTOMER"
                              ? [
                                  {
                                    label: "Offboard",
                                    variant: "destructive" as const,
                                    onSelect: () =>
                                      setPendingAction({
                                        kind: "offboard",
                                        member,
                                      }),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </ResponsiveTable>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {data.pagination.page} of {Math.max(data.pagination.totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              page >= data.pagination.totalPages || query.isFetching
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <StaffInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <StaffAccessDialog
        member={accessTarget}
        onOpenChange={(open) => {
          if (!open) setAccessTarget(null);
        }}
      />

      <StaffConfirmDialog
        action={pendingAction}
        isPending={confirmMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
}
