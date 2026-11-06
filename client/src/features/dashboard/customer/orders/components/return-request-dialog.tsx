"use client";

import { useMemo, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReturnRequestMutation } from "@/features/dashboard/customer/orders/hooks/use-order-mutations";
import type { ReturnRequestDialogProps } from "@/features/dashboard/customer/orders/types";

const REASONS = [
  "Damaged item",
  "Wrong item received",
  "Not as described",
  "Changed my mind",
  "Other",
] as const;

export function ReturnRequestDialog({
  open,
  onOpenChange,
  orderId,
  items,
}: ReturnRequestDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const selectedCount = useMemo(
    () =>
      Object.values(quantities).filter((qty) => {
        const n = Number(qty);
        return Number.isFinite(n) && n > 0;
      }).length,
    [quantities],
  );

  const mutation = useReturnRequestMutation({
    orderId,
    onSuccess: () => {
      setQuantities({});
      setReason("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setQuantities({});
          setReason("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Return</DialogTitle>
          <DialogDescription>
            Choose a reason and the quantity of each item to return.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="return-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="return-reason" aria-label="Return reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            {items.map((item) => {
              const qty = quantities[item.id] ?? "";
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ordered: {item.quantity}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Label
                      htmlFor={`qty-${item.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Qty
                    </Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="Qty"
                      value={qty}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setQuantities((prev) => ({
                            ...prev,
                            [item.id]: "",
                          }));
                          return;
                        }
                        const next = Number(raw);
                        if (!Number.isFinite(next)) return;
                        const clamped = Math.min(
                          item.quantity,
                          Math.max(0, Math.trunc(next)),
                        );
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: String(clamped),
                        }));
                      }}
                      className="h-11 w-20 text-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <DialogFooter>
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
            disabled={mutation.isPending || selectedCount === 0 || !reason}
            onClick={() => {
              const payloadItems = Object.entries(quantities)
                .map(([orderItemId, raw]) => ({
                  orderItemId,
                  quantity: Number(raw),
                }))
                .filter((entry) => Number.isFinite(entry.quantity) && entry.quantity > 0)
                .map(({ orderItemId, quantity }) => ({
                  orderItemId,
                  quantity,
                  restockOrRefund: "REFUND" as const,
                }));
              mutation.mutate({ reason, items: payloadItems });
            }}
          >
            {mutation.isPending ? "Submitting..." : "Submit return request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
