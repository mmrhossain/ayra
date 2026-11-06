"use client";

import { useEffect, useState } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompleteRefundDialog } from "@/features/dashboard/admin/refunds/components/complete-refund-dialog";
import { useRefundList } from "@/features/dashboard/admin/refunds/hooks/use-refund-list";
import { money } from "@/features/dashboard/admin/orders/api/orders";
import { useUpdateRefundStatusMutation } from "@/features/dashboard/admin/payments/hooks/use-payment-mutations";
import {
  PAYMENT_METHODS,
  REFUND_STATUSES,
  type PaymentMethodFilter,
  type RefundListResult,
  type RefundQueueItem,
  type RefundStatus,
} from "@/features/dashboard/admin/payments/types";
import {
  paymentCustomerLabel,
  toPaymentErrorMessage,
} from "@/features/dashboard/admin/payments/utils";
import { statusColor } from "@/helpers";

type Props = {
  initialData: RefundListResult;
};

export function RefundTable({ initialData }: Props) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [status, setStatus] = useState<RefundStatus | "">("");
  const [method, setMethod] = useState<PaymentMethodFilter | "">("");
  const [manual, setManual] = useState<"" | "true" | "false">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selected, setSelected] = useState<RefundQueueItem | null>(null);

  const mutation = useUpdateRefundStatusMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { query, items, pagination } = useRefundList({
    initialData,
    page,
    status,
    method,
    search,
    manual,
  });

  function openComplete(refund: RefundQueueItem) {
    setSelected(refund);
    setCompleteOpen(true);
  }

  function updateStatus(
    refund: RefundQueueItem,
    next: "APPROVED" | "REJECTED" | "PROCESSING",
  ) {
    mutation.mutate({ refundId: refund.id, status: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Refund, order #, customer"
            aria-label="Search refunds"
            className="w-full sm:w-64"
          />
          <Select
            value={status || "__all__"}
            onValueChange={(value) => {
              setStatus(value === "__all__" ? "" : (value as RefundStatus));
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
              {REFUND_STATUSES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={method || "__all__"}
            onValueChange={(value) => {
              setMethod(
                value === "__all__" ? "" : (value as PaymentMethodFilter),
              );
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-full sm:w-44"
              aria-label="Filter by payment method"
            >
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All methods</SelectItem>
              {PAYMENT_METHODS.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={manual || "__all__"}
            onValueChange={(value) => {
              setManual(
                value === "__all__" ? "" : (value as "true" | "false"),
              );
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-full sm:w-52"
              aria-label="Filter by manual processing"
            >
              <SelectValue placeholder="All refunds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All refunds</SelectItem>
              <SelectItem value="true">Manual processing</SelectItem>
              <SelectItem value="false">Automatic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {pagination.total} refunds
        </p>
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toPaymentErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No refunds found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell>
                      <p className="font-medium">
                        {refund.payment.order?.orderNumber ?? "—"}
                      </p>
                      {refund.reason ? (
                        <p className="max-w-56 truncate text-xs text-muted-foreground">
                          {refund.reason}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {paymentCustomerLabel(refund.payment)}
                    </TableCell>
                    <TableCell>
                      <p>{refund.payment.method}</p>
                      <p className="text-xs text-muted-foreground">
                        {refund.payment.status}
                      </p>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {money(refund.amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${statusColor(refund.status)}`}
                      >
                        {refund.status}
                      </span>
                      {refund.requiresManualProcessing ? (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                          Manual
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(refund.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {refund.status === "PENDING" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={mutation.isPending}
                              onClick={() => updateStatus(refund, "APPROVED")}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={mutation.isPending}
                              onClick={() => updateStatus(refund, "REJECTED")}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                        {refund.status === "APPROVED" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={mutation.isPending}
                              onClick={() => updateStatus(refund, "PROCESSING")}
                            >
                              Processing
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={mutation.isPending}
                              onClick={() => openComplete(refund)}
                            >
                              Complete
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={mutation.isPending}
                              onClick={() => updateStatus(refund, "REJECTED")}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                        {refund.status === "PROCESSING" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={mutation.isPending}
                            onClick={() => openComplete(refund)}
                          >
                            Complete
                          </Button>
                        ) : null}
                        {refund.status === "COMPLETED" ||
                        refund.status === "REJECTED" ? (
                          <span className="text-xs text-muted-foreground">
                            {refund.refundedAt
                              ? new Date(refund.refundedAt).toLocaleDateString()
                              : "Closed"}
                          </span>
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
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <CompleteRefundDialog
        key={`${selected?.id ?? "none"}-${completeOpen}`}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        refund={selected}
      />
    </div>
  );
}
