"use client";

import Link from "next/link";
import { useState } from "react";

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
import { ReturnReviewDialog } from "@/features/dashboard/admin/orders/components/return-review-dialog";
import {
  returnCustomerLabel,
  toOrderErrorMessage,
  type AdminReturnRequest,
  type ReturnRequestListResult,
  type ReturnRequestStatus,
} from "@/features/dashboard/admin/orders/api/orders";
import { useReturnList } from "@/features/dashboard/admin/return/hooks/use-return-list";

const STATUSES: ReturnRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];

type Props = {
  initialData: ReturnRequestListResult;
};

function statusClassName(status: ReturnRequestStatus): string {
  if (status === "REJECTED") return "bg-destructive text-white";
  if (status === "APPROVED") return "bg-primary text-primary-foreground";
  return "bg-secondary text-secondary-foreground";
}

export function ReturnTable({ initialData }: Props) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [status, setStatus] = useState<ReturnRequestStatus | "">("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">(
    "APPROVED",
  );
  const [selected, setSelected] = useState<AdminReturnRequest | null>(null);

  const { query, items, pagination } = useReturnList({
    initialData,
    page,
    status,
  });

  function openReview(
    request: AdminReturnRequest,
    next: "APPROVED" | "REJECTED",
  ) {
    setSelected(request);
    setReviewStatus(next);
    setReviewOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={status || "__all__"}
          onValueChange={(v) => {
            setStatus(v === "__all__" ? "" : (v as ReturnRequestStatus));
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-full sm:w-52"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {pagination.total} returns
        </p>
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toOrderErrorMessage(query.error)}</p>
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
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No return requests found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <Link href="/admin/orders" className="hover:underline">
                        {request.order?.orderNumber ?? request.orderId}
                      </Link>
                      {request.order?.status ? (
                        <p className="text-xs text-muted-foreground">
                          {request.order.status}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>{returnCustomerLabel(request)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {request.reason || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${statusClassName(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.requestedAt || request.createdAt
                        ? new Date(
                            request.requestedAt ?? request.createdAt ?? "",
                          ).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openReview(request, "APPROVED")}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openReview(request, "REJECTED")}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {request.adminNote || "Reviewed"}
                        </span>
                      )}
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

      <ReturnReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        request={selected}
        status={reviewStatus}
      />
    </div>
  );
}
