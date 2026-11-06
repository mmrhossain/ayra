"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { fetchShipmentById } from "@/features/dashboard/admin/shipments/api/shipments";
import type { ShipmentListItem } from "@/features/dashboard/admin/shipments/types/models";
import {
  formatShipmentDate,
  SHIPMENT_STATUS_LABELS,
  shipmentStatusVariant,
  toShipmentErrorMessage,
} from "@/features/dashboard/admin/shipments/utils";
import { formatMoney } from "@/lib/format";

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value ?? "-"}</dd>
    </div>
  );
}

export function ShipmentDetailDialog({
  shipment,
  open,
  onOpenChange,
}: {
  shipment: ShipmentListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const shipmentId = shipment?.id ?? "";
  const query = useQuery({
    queryKey: ["admin-shipment", shipmentId],
    queryFn: () => fetchShipmentById(shipmentId),
    enabled: open && Boolean(shipmentId),
    staleTime: 10_000,
  });

  const detail = query.data;
  const address = detail?.shipmentAddress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {shipment?.shipmentNumber ?? "Shipment"}
            {detail ? (
              <StatusBadge variant={shipmentStatusVariant(detail.status)}>
                {SHIPMENT_STATUS_LABELS[detail.status]}
              </StatusBadge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {detail
              ? `Created ${formatShipmentDate(detail.createdAt)}`
              : "Shipment details"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {query.isError ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 p-4"
            >
              <p className="text-sm">{toShipmentErrorMessage(query.error)}</p>
            </div>
          ) : query.isLoading || !detail ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Order" value={detail.order.orderNumber} />
                <Field label="Order status" value={detail.order.status} />
                <Field
                  label="Payment"
                  value={detail.order.paymentStatus}
                />
                <Field label="Courier" value={detail.courierProvider} />
                <Field
                  label="Tracking number"
                  value={detail.trackingNumber ?? "-"}
                />
                <Field
                  label="Courier reference"
                  value={detail.courierReference ?? "-"}
                />
                <Field
                  label="Warehouse"
                  value={`${detail.warehouse.name} (${detail.warehouse.code})`}
                />
                <Field
                  label="Shipping cost"
                  value={formatMoney(detail.shippingCost)}
                />
                <Field
                  label="Label"
                  value={
                    detail.labelUrl ? (
                      <a
                        href={detail.labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Open label
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
                <Field
                  label="Shipped at"
                  value={formatShipmentDate(detail.shippedAt)}
                />
                <Field
                  label="Delivered at"
                  value={formatShipmentDate(detail.deliveredAt)}
                />
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-medium">Shipping address</h3>
                {address ? (
                  <address className="text-sm not-italic text-muted-foreground">
                    <span className="block text-foreground">
                      {address.fullName}
                    </span>
                    <span className="block">{address.phone}</span>
                    <span className="block">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                    </span>
                    <span className="block">
                      {[address.thana, address.area, address.district, address.division]
                        .filter(Boolean)
                        .join(", ")}
                      {address.postalCode ? ` ${address.postalCode}` : ""}
                    </span>
                    <span className="block">{address.country}</span>
                  </address>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No shipping address recorded.
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium">Items</h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No items
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.orderItem.productName}
                              {item.orderItem.variantName ? (
                                <span className="block text-xs text-muted-foreground">
                                  {item.orderItem.variantName}
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.orderItem.sku}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium">Tracking timeline</h3>
                {detail.trackingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tracking events yet.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {detail.trackingEvents.map((event) => (
                      <li key={event.id} className="flex gap-3 text-sm">
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                        <div className="space-y-0.5">
                          <p className="font-medium">
                            {SHIPMENT_STATUS_LABELS[event.status]}
                            {event.location ? ` - ${event.location}` : ""}
                          </p>
                          {event.description ? (
                            <p className="text-muted-foreground">
                              {event.description}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {formatShipmentDate(event.eventTime)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {detail.notes ? (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Notes</h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {detail.notes}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
