"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CreateShipmentDialog } from "@/features/dashboard/admin/shipments/components/create-shipment-dialog";
import { ShipmentDetailDialog } from "@/features/dashboard/admin/shipments/components/shipment-detail-dialog";
import { UpdateShipmentStatusDialog } from "@/features/dashboard/admin/shipments/components/update-shipment-status-dialog";
import { useBookCourierMutation } from "@/features/dashboard/admin/shipments/hooks/use-shipment-mutations";
import { useShipmentList } from "@/features/dashboard/admin/shipments/hooks/use-shipment-list";
import type {
  CourierProvider,
  ShipmentListItem,
  ShipmentListResult,
  ShipmentStatus,
} from "@/features/dashboard/admin/shipments/types/models";
import {
  COURIER_PROVIDERS,
  formatShipmentDate,
  nextShipmentStatuses,
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_LABELS,
  shipmentStatusVariant,
  toShipmentErrorMessage,
} from "@/features/dashboard/admin/shipments/utils";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const BOOKABLE_PROVIDERS = new Set<CourierProvider>(["PATHAO", "STEADFAST"]);

export function ShipmentsTable({
  initialData,
}: {
  initialData: ShipmentListResult;
}) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ShipmentStatus | "">("");
  const [courierProvider, setCourierProvider] = useState<CourierProvider | "">(
    "",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ShipmentListItem | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [detailShipment, setDetailShipment] =
    useState<ShipmentListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const bookMutation = useBookCourierMutation();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { query, items, pagination } = useShipmentList({
    initialData,
    page,
    status,
    courierProvider,
    search,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search shipment, tracking, order"
            aria-label="Search shipments"
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ShipmentStatus | "");
              setPage(1);
            }}
            aria-label="Filter shipments by status"
            className={selectClass}
          >
            <option value="">All statuses</option>
            {SHIPMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {SHIPMENT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <select
            value={courierProvider}
            onChange={(event) => {
              setCourierProvider(event.target.value as CourierProvider | "");
              setPage(1);
            }}
            aria-label="Filter shipments by courier"
            className={selectClass}
          >
            <option value="">All couriers</option>
            {COURIER_PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {pagination.total} shipments
          </p>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            New shipment
          </Button>
        </div>
      </div>

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toShipmentErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched && items.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Courier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No shipments found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {shipment.shipmentNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatShipmentDate(shipment.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{shipment.order.orderNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          {shipment.order.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {shipment.warehouse.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{shipment.courierProvider}</span>
                        <span className="text-xs text-muted-foreground">
                          {shipment.trackingNumber ?? "No tracking"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={shipmentStatusVariant(shipment.status)}>
                        {SHIPMENT_STATUS_LABELS[shipment.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {shipment._count.items}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDetailShipment(shipment);
                            setDetailOpen(true);
                          }}
                        >
                          View
                        </Button>
                        {BOOKABLE_PROVIDERS.has(shipment.courierProvider) &&
                        !shipment.courierReference &&
                        (shipment.status === "PENDING" ||
                          shipment.status === "READY_TO_SHIP") ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={bookMutation.isPending}
                            onClick={() => bookMutation.mutate(shipment.id)}
                          >
                            {bookMutation.isPending ? "Booking…" : "Book courier"}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={nextShipmentStatuses(shipment.status).length === 0}
                          onClick={() => {
                            setSelected(shipment);
                            setStatusOpen(true);
                          }}
                        >
                          Update
                        </Button>
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
            onClick={() =>
              setPage((current) =>
                Math.min(Math.max(pagination.totalPages, 1), current + 1),
              )
            }
          >
            Next
          </Button>
        </div>
      </div>

      <CreateShipmentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <UpdateShipmentStatusDialog
        key={`${selected?.id ?? "none"}-${statusOpen ? "open" : "closed"}`}
        shipment={selected}
        open={statusOpen}
        onOpenChange={setStatusOpen}
      />
      <ShipmentDetailDialog
        shipment={detailShipment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
