"use client";

import { useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
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
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";
import {
  isUserBanned,
  toUserErrorMessage,
  USER_ROLES,
  USER_STATUSES,
  type AdminUserItem,
  type UserListResult,
  type UserRole,
  type UserStatus,
} from "@/features/dashboard/admin/customers/api/customer";
import { UserBanDialog } from "@/features/dashboard/admin/customers/components/user-ban-dialog";
import { useUserList } from "@/features/dashboard/admin/customers/hooks/use-user-list";

type Props = {
  initialData: UserListResult;
  initialRole?: UserRole;
  initialStatus?: UserStatus;
};

export function UserTable({ initialData, initialRole, initialStatus }: Props) {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<UserRole | "">(initialRole ?? "");
  const [status, setStatus] = useState<UserStatus | "">(initialStatus ?? "");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [banSelected, setBanSelected] = useState<AdminUserItem | null>(null);
  const [ban, setBan] = useState(true);

  const {
    query,
    items: listItems,
    pagination,
  } = useUserList({
    initialData,
    page,
    role,
    status,
    initialRole,
    initialStatus,
  });

  // React Compiler অটোমেটিক মেমোরাইজ করবে (useMemo ছাড়া)
  const q = search.trim().toLowerCase();
  const items = q
    ? listItems.filter(
        (user) => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
      )
    : listItems;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search by name or email"
            className="w-full sm:max-w-64"
          />
          <Select
            value={role || "__all__"}
            onValueChange={(v) => {
              setRole(v === "__all__" ? "" : (v as UserRole));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by role">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All roles</SelectItem>
              {USER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status || "__all__"}
            onValueChange={(v) => {
              setStatus(v === "__all__" ? "" : (v as UserStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {USER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{pagination.total} users</p>
      </div>

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toUserErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Verified</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell data-label="Image">
                      <UserAvatar
                        src={user.image}
                        name={user.name}
                        showInitials
                        iconSize={18}
                        className="size-10 border sm:size-12"
                      />
                    </TableCell>
                    <TableCell data-label="Name" className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="break-words">{user.name}</span>
                        {isUserBanned(user) ? (
                          <StatusBadge variant="danger" className="uppercase tracking-wide">
                            Banned
                          </StatusBadge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell data-label="Email" className="break-all text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell data-label="Role">
                      <StatusBadge variant="info">{user.role}</StatusBadge>
                    </TableCell>
                    <TableCell data-label="Status" className="text-muted-foreground">
                      {isUserBanned(user) ? "BANNED" : (user.status ?? "ACTIVE")}
                    </TableCell>
                    <TableCell data-label="Email verified">
                      <StatusBadge variant={user.emailVerified ? "success" : "danger"}>
                        {user.emailVerified ? "Verified" : "Not Verified"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell data-label="Joined" className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell data-label="Actions" className="text-right">
                      <div>
                        <Button
                          type="button"
                          variant={isUserBanned(user) ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => {
                            setBanSelected(user);
                            setBan(!isUserBanned(user));
                            setDialogOpen(true);
                          }}
                        >
                          {isUserBanned(user) ? "Unban" : "Ban"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </ResponsiveTable>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <UserBanDialog open={dialogOpen} onOpenChange={setDialogOpen} user={banSelected} ban={ban} />
    </div>
  );
}
