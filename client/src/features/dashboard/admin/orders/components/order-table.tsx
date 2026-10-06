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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderDetailDialog } from "@/features/dashboard/admin/orders/components/order-detail-dialog";
import {
  customerLabel,
  money,
  ORDER_STATUSES,
  toOrderErrorMessage,
  type OrderListItem,
  type OrderListResult,
  type OrderStatus,
} from "@/features/dashboard/admin/orders/api/orders";
import { useOrderList } from "@/features/dashboard/admin/orders/hooks/use-order-list";
import { statusColor } from "@/helpers";
import { dateToIsoEnd, dateToIsoStart } from "@/lib/format";

type Props = {
  initialData: OrderListResult;
};

export function OrderTable({ initialData }: Props) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<OrderListItem | null>(null);

  const from = dateToIsoStart(fromDate);
  const to = dateToIsoEnd(toDate);

  const { query, items, pagination } = useOrderList({
    initialData,
    page,
    status,
    from,
    to,
  });

  function openRow(order: OrderListItem) {
    setSelected(order);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={status || "__all__"}
            onValueChange={(v) => {
              setStatus(v === "__all__" ? "" : (v as OrderStatus));
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
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            aria-label="From date"
            className="w-full sm:w-40"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            aria-label="To date"
            className="w-full sm:w-40"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {pagination.total} orders
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
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => openRow(order)}
                  >
                    <TableCell>
                      <p className="font-medium">{order.orderNumber}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customerLabel(order)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${statusColor(order?.status)}`}
                      >
                        {order?.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium">
                        {order.paymentStatus ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {money(order.grandTotal)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRow(order);
                        }}
                      >
                        View
                      </Button>
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

      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        order={selected}
      />
    </div>
  );
}
