"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  toUserErrorMessage,
  type AdminUserItem,
  type UserListResult,
} from "@/features/dashboard/admin/customers/api/customer";
import { UserApproveDialog } from "@/features/dashboard/admin/customers/components/user-approve-dialog";
import { VendorDetailDialog } from "@/features/dashboard/admin/vendors/components/vendor-detail-dialog";
import { useVendorList } from "@/features/dashboard/admin/vendors/hooks/use-vendor-list";
import Image from "next/image";

type ApprovalFilter = "pending" | "approved" | "";

type Props = {
  initialData: UserListResult;
};

export function VendorTable({ initialData }: Props) {
  const [page, setPage] = useState(1);
  const [approval, setApproval] = useState<ApprovalFilter>("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [selected, setSelected] = useState<AdminUserItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewing, setViewing] = useState<AdminUserItem | null>(null);

  const {
    query,
    items: listItems,
    pagination,
  } = useVendorList({
    initialData,
    page,
  });

  const items = useMemo(() => {
    if (approval === "pending") {
      return listItems.filter((vendor) => !vendor.isApproved);
    }
    if (approval === "approved") {
      return listItems.filter((vendor) => vendor.isApproved);
    }
    return listItems;
  }, [listItems, approval]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={approval || "__all__"}
          onValueChange={(v) => setApproval(v === "__all__" ? "" : (v as ApprovalFilter))}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by approval">
            <SelectValue placeholder="All vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{pagination.total} vendors</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Shop slug</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No vendors found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <Image
                        src={
                          vendor.vendorProfile?.logo ||
                          vendor.image ||
                          "https://placehold.jp/160x96.png"
                        }
                        alt={vendor.vendorProfile?.shopName || vendor.name}
                        className="h-12 w-20 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vendor.vendorProfile?.shopSlug || "—"}
                    </TableCell>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell className="text-muted-foreground">{vendor.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${
                          vendor.isApproved
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {vendor.isApproved ? "Approved" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setViewing(vendor);
                            setDetailOpen(true);
                          }}
                        >
                          View
                        </Button>
                        {!vendor.isApproved ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setSelected(vendor);
                              setApproveOpen(true);
                            }}
                          >
                            Approve
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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

      <UserApproveDialog open={approveOpen} onOpenChange={setApproveOpen} user={selected} approve />
      <VendorDetailDialog open={detailOpen} onOpenChange={setDetailOpen} vendor={viewing} />
    </div>
  );
}
