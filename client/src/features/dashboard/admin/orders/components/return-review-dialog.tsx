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
import { Textarea } from "@/components/ui/textarea";
import type { AdminReturnRequest } from "@/features/dashboard/admin/orders/api/orders";
import { useReturnReviewMutation } from "@/features/dashboard/admin/orders/hooks/use-return-review";

export type ReturnReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AdminReturnRequest | null;
  status: "APPROVED" | "REJECTED";
};

export function ReturnReviewDialog({
  open,
  onOpenChange,
  request,
  status,
}: ReturnReviewDialogProps) {
  const [adminNote, setAdminNote] = useState("");
  const [damagedIds, setDamagedIds] = useState<Set<string>>(() => new Set());
  const action = status === "APPROVED" ? "Approve" : "Reject";
  const mutation = useReturnReviewMutation({
    request,
    status,
    onSuccess: () => {
      setAdminNote("");
      setDamagedIds(new Set());
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setAdminNote("");
          setDamagedIds(new Set());
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{action} return</DialogTitle>
          <DialogDescription>
            {request
              ? `${action} return for order ${request.order?.orderNumber ?? request.orderId}?`
              : `${action} this return request?`}
          </DialogDescription>
        </DialogHeader>
        {request && request.items.length > 0 ? (
          <div className="space-y-2 rounded-xl border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Items being returned
            </p>
            {request.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.orderItem?.productName ?? item.orderItemId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.orderItem?.sku ?? "SKU unavailable"}
                    {item.orderItem?.variantName
                      ? ` · ${item.orderItem.variantName}`
                      : ""}
                    {` · Qty ${item.quantity}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.restockOrRefund === "RESTOCK"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {item.restockOrRefund}
                  </span>
                  {status === "APPROVED" &&
                  item.restockOrRefund === "RESTOCK" ? (
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={damagedIds.has(item.orderItemId)}
                        onChange={(e) => {
                          setDamagedIds((current) => {
                            const next = new Set(current);
                            if (e.target.checked) next.add(item.orderItemId);
                            else next.delete(item.orderItemId);
                            return next;
                          });
                        }}
                      />
                      Damaged (do not restock)
                    </label>
                  ) : null}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Approving queues a manual refund for the returned quantities.
              Damaged items are not restocked and their buying cost is not
              reversed.
            </p>
          </div>
        ) : null}
        <Textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Admin note (optional)"
          aria-label="Admin note"
        />
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
            variant={status === "REJECTED" ? "destructive" : "default"}
            disabled={!request || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                adminNote,
                ...(status === "APPROVED" && request
                  ? {
                      items: request.items.map((item) => ({
                        orderItemId: item.orderItemId,
                        restockToStock:
                          item.restockOrRefund === "RESTOCK" &&
                          !damagedIds.has(item.orderItemId),
                        damaged: damagedIds.has(item.orderItemId),
                      })),
                    }
                  : {}),
              })
            }
          >
            {mutation.isPending ? `${action.slice(0, -1)}ing...` : action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
