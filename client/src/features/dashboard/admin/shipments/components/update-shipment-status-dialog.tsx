"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
import { useUpdateShipmentStatusMutation } from "@/features/dashboard/admin/shipments/hooks/use-shipment-mutations";
import type {
  ShipmentListItem,
  ShipmentStatus,
} from "@/features/dashboard/admin/shipments/types/models";
import {
  nextShipmentStatuses,
  SHIPMENT_STATUS_LABELS,
} from "@/features/dashboard/admin/shipments/utils";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function UpdateShipmentStatusDialog({
  shipment,
  open,
  onOpenChange,
}: {
  shipment: ShipmentListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const options = shipment ? nextShipmentStatuses(shipment.status) : [];
  const [status, setStatus] = useState<ShipmentStatus | "">(
    () => options[0] ?? "",
  );
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [trackingNumber, setTrackingNumber] = useState(
    () => shipment?.trackingNumber ?? "",
  );

  const mutation = useUpdateShipmentStatusMutation(() => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Update shipment</DialogTitle>
          <DialogDescription>
            {shipment
              ? `${shipment.shipmentNumber} is currently ${SHIPMENT_STATUS_LABELS[shipment.status]}.`
              : "Update shipment status."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-2">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This shipment is in a terminal status and cannot be updated.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                <Label htmlFor="shipment-status">Next status</Label>
                <select
                  id="shipment-status"
                  className={selectClass}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ShipmentStatus)
                  }
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {SHIPMENT_STATUS_LABELS[option]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="shipment-location">Location</Label>
                <Input
                  id="shipment-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shipment-description">Description</Label>
                <Input
                  id="shipment-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shipment-tracking-update">
                  Tracking number
                </Label>
                <Input
                  id="shipment-tracking-update"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="Optional"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              !shipment || !status || mutation.isPending || options.length === 0
            }
            onClick={() => {
              if (!shipment || !status) return;
              mutation.mutate({
                id: shipment.id,
                body: {
                  status,
                  ...(location.trim() ? { location: location.trim() } : {}),
                  ...(description.trim()
                    ? { description: description.trim() }
                    : {}),
                  ...(trackingNumber.trim()
                    ? { trackingNumber: trackingNumber.trim() }
                    : {}),
                },
              });
            }}
          >
            {mutation.isPending ? "Saving..." : "Save status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
