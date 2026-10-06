import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  OrderStatus,
  OrderStatusActionsProps,
} from "@/features/dashboard/admin/orders/types";
import { money } from "@/features/dashboard/admin/orders/utils";
import {
  isCodCollectable,
  isRefundable,
} from "@/features/dashboard/admin/payments/utils";

export function OrderStatusActions({
  payments,
  onCollect,
  onRefund,
  nextStatuses,
  status,
  onStatusChange,
  remarks,
  onRemarksChange,
}: OrderStatusActionsProps) {
  return (
    <>
      {payments.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium">Payments</p>
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{payment.method}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.status} ·{" "}
                    {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="tabular-nums">{money(payment.amount)}</p>
                  {isCodCollectable(payment) ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onCollect(payment)}
                    >
                      Collect
                    </Button>
                  ) : null}
                  {isRefundable(payment) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onRefund(payment)}
                    >
                      Refund
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Update status</p>
        {nextStatuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No further transitions available.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="order-status">Status</Label>
              <Select
                value={status || undefined}
                onValueChange={(v) => onStatusChange(v as OrderStatus)}
              >
                <SelectTrigger id="order-status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="order-remarks">Remarks (optional)</Label>
              <Textarea
                id="order-remarks"
                value={remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Internal note"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
