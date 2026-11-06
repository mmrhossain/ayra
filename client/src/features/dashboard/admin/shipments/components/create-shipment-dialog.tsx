"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchShipmentOrderContext } from "@/features/dashboard/admin/shipments/api/shipments";
import { useCreateShipmentMutation } from "@/features/dashboard/admin/shipments/hooks/use-shipment-mutations";
import type {
  CourierProvider,
} from "@/features/dashboard/admin/shipments/types/models";
import {
  COURIER_PROVIDERS,
  toShipmentErrorMessage,
} from "@/features/dashboard/admin/shipments/utils";

const SHIPPABLE_STATUSES = new Set([
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
]);

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function CreateShipmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reference, setReference] = useState("");
  const [lookup, setLookup] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [warehouseId, setWarehouseId] = useState("");
  const [courierProvider, setCourierProvider] =
    useState<CourierProvider>("INTERNAL");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [notes, setNotes] = useState("");

  const contextQuery = useQuery({
    queryKey: ["shipment-order-context", lookup],
    queryFn: () => fetchShipmentOrderContext(lookup),
    enabled: lookup.length > 0,
    retry: false,
  });

  const context = contextQuery.data;
  const [loadedContextId, setLoadedContextId] = useState<string | null>(null);

  if (context && context.order.id !== loadedContextId) {
    setLoadedContextId(context.order.id);
    setSelected(
      Object.fromEntries(
        context.items
          .filter((item) => item.remainingQuantity > 0)
          .map((item) => [item.id, item.remainingQuantity]),
      ),
    );
    setWarehouseId((current) => current || context.warehouses[0]?.id || "");
  }

  const reset = () => {
    setReference("");
    setLookup("");
    setSelected({});
    setWarehouseId("");
    setCourierProvider("INTERNAL");
    setTrackingNumber("");
    setShippingCost("");
    setNotes("");
  };

  const mutation = useCreateShipmentMutation(() => {
    reset();
    onOpenChange(false);
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const orderEligible = context
    ? SHIPPABLE_STATUSES.has(context.order.status)
    : false;
  const selectedItems = Object.entries(selected)
    .filter(([, quantity]) => quantity > 0)
    .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

  const submit = () => {
    if (!context) return;
    if (!warehouseId) {
      toast.error("Select a warehouse");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Select at least one item to ship");
      return;
    }

    const cost = shippingCost.trim() === "" ? undefined : Number(shippingCost);
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
      toast.error("Shipping cost must be a positive number");
      return;
    }

    mutation.mutate({
      orderId: context.order.id,
      warehouseId,
      courierProvider,
      items: selectedItems,
      ...(trackingNumber.trim()
        ? { trackingNumber: trackingNumber.trim() }
        : {}),
      ...(cost !== undefined ? { shippingCost: cost } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>New shipment</DialogTitle>
          <DialogDescription>
            Load an order, choose the items and hand them to a courier.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Order ID or order number"
              aria-label="Order ID or order number"
              onKeyDown={(event) => {
                if (event.key === "Enter") setLookup(reference.trim());
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setLookup(reference.trim())}
              disabled={!reference.trim() || contextQuery.isFetching}
            >
              {contextQuery.isFetching ? "Loading..." : "Load order"}
            </Button>
          </div>

          {contextQuery.isError ? (
            <p className="text-sm text-destructive">
              {toShipmentErrorMessage(contextQuery.error)}
            </p>
          ) : null}

          {context ? (
            <>
              <div className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-medium">{context.order.orderNumber}</span>
                  <span className="text-muted-foreground">
                    Status: {context.order.status}
                  </span>
                  <span className="text-muted-foreground">
                    Payment: {context.order.paymentStatus}
                  </span>
                </div>
                {!orderEligible ? (
                  <p className="mt-2 text-sm leading-snug text-destructive">
                    This order is not ready for shipment.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Items</p>
                {context.items.map((item) => {
                  const checked = item.id in selected;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={item.remainingQuantity === 0}
                        onCheckedChange={(next) => {
                          setSelected((current) => {
                            const copy = { ...current };
                            if (next === true) {
                              copy[item.id] = item.remainingQuantity;
                            } else {
                              delete copy[item.id];
                            }
                            return copy;
                          });
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku}
                          {item.variantName ? ` / ${item.variantName}` : ""} -
                          ordered {item.quantity}, shipped {item.shippedQuantity}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={item.remainingQuantity}
                        value={selected[item.id] ?? ""}
                        disabled={!checked}
                        aria-label={`Quantity for ${item.sku}`}
                        className="w-24"
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          setSelected((current) => ({
                            ...current,
                            [item.id]: Number.isFinite(next)
                              ? Math.min(
                                  Math.max(Math.trunc(next), 1),
                                  item.remainingQuantity,
                                )
                              : 1,
                          }));
                        }}
                      />
                      <span className="w-24 text-right text-xs text-muted-foreground">
                        {item.remainingQuantity} left
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="shipment-warehouse">Warehouse</Label>
                  <select
                    id="shipment-warehouse"
                    className={selectClass}
                    value={warehouseId}
                    onChange={(event) => setWarehouseId(event.target.value)}
                  >
                    <option value="">Select warehouse</option>
                    {context.warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="shipment-courier">Courier</Label>
                  <select
                    id="shipment-courier"
                    className={selectClass}
                    value={courierProvider}
                    onChange={(event) =>
                      setCourierProvider(event.target.value as CourierProvider)
                    }
                  >
                    {COURIER_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="shipment-tracking">Tracking number</Label>
                  <Input
                    id="shipment-tracking"
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="shipment-cost">Shipping cost (BDT)</Label>
                  <Input
                    id="shipment-cost"
                    type="number"
                    min={0}
                    value={shippingCost}
                    onChange={(event) => setShippingCost(event.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="shipment-notes">Notes</Label>
                  <Input
                    id="shipment-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!context || !orderEligible || mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
