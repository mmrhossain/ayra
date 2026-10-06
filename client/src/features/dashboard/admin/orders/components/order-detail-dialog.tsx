"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { OrderDetailHeader } from "@/features/dashboard/admin/orders/components/order-detail-header";
import { OrderDetailLines } from "@/features/dashboard/admin/orders/components/order-detail-lines";
import { OrderStatusActions } from "@/features/dashboard/admin/orders/components/order-status-actions";
import { useOrderDetail } from "@/features/dashboard/admin/orders/hooks/use-order-detail";
import type { OrderDetailDialogProps } from "@/features/dashboard/admin/orders/types";
import {
  ALLOWED_TRANSITIONS,
  customerLabel,
  formatAddress,
  pickOrderAddress,
  toOrderErrorMessage,
} from "@/features/dashboard/admin/orders/utils";
import { CollectCodDialog } from "@/features/dashboard/admin/payments/components/collect-cod-dialog";
import { RefundDialog } from "@/features/dashboard/admin/payments/components/refund-dialog";
import { formatMoney } from "@/lib/format";

export { ALLOWED_TRANSITIONS };
export type { OrderDetailDialogProps };

export function OrderDetailDialog({ open, onOpenChange, order }: OrderDetailDialogProps) {
  const {
    detailQuery,
    detail,
    nextStatuses,
    returnsQuery,
    reviewMutation,
    mutation,
    status,
    setStatus,
    remarks,
    setRemarks,
    collectOpen,
    setCollectOpen,
    refundOpen,
    setRefundOpen,
    activePayment,
    adminNote,
    setAdminNote,
    handleCollect,
    handleRefund,
  } = useOrderDetail(open, order);

  const history = detailQuery.data?.statusHistory ?? [];
  const payments = detailQuery.data?.payments ?? [];
  const shippingText = detailQuery.data
    ? formatAddress(pickOrderAddress(detailQuery.data, "SHIPPING"))
    : null;
  const billingText = detailQuery.data
    ? formatAddress(pickOrderAddress(detailQuery.data, "BILLING"))
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl scrollbar-hide">
        <DialogHeader>
          <DialogTitle>{detail ? `Order ${detail.orderNumber}` : "Order"}</DialogTitle>
          <DialogDescription>
            {detail ? `${customerLabel(detail)} · ${detail.status}` : "Order details"}
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isError ? (
          <div role="alert" className="rounded-xl border border-destructive/30 p-4">
            <p className="text-sm">{toOrderErrorMessage(detailQuery.error)}</p>
          </div>
        ) : null}

        {!detail && detailQuery.isFetching ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : null}

        {detail ? (
          <div className="space-y-6">
            <OrderDetailHeader
              customerLabel={customerLabel(detail)}
              customerEmail={detail.customerProfile?.user?.email}
              status={detail.status}
              paymentStatus={detail.paymentStatus}
              shippingText={shippingText}
              billingText={billingText}
            />

            <OrderDetailLines items={detail.items} />

            {(returnsQuery.data?.items.length ?? 0) > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium">Return requests</p>
                <div className="space-y-2">
                  {returnsQuery.data!.items.map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{req.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.reason || "No reason"} · {req.items.length} item(s)
                        </p>
                      </div>
                      {req.status === "PENDING" ? (
                        <div className="flex w-full flex-col gap-2 sm:w-auto">
                          <Textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            maxLength={1000}
                            rows={2}
                            placeholder="Admin note (optional)"
                            aria-label="Admin note"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={reviewMutation.isPending}
                              onClick={() =>
                                reviewMutation.mutate({
                                  id: req.id,
                                  status: "APPROVED",
                                })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={reviewMutation.isPending}
                              onClick={() =>
                                reviewMutation.mutate({
                                  id: req.id,
                                  status: "REJECTED",
                                })
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ) : req.adminNote ? (
                        <p className="text-xs text-muted-foreground">{req.adminNote}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {history.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium">Status history</p>
                <ol className="space-y-3 border-l pl-4">
                  {history.map((entry) => (
                    <li key={entry.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{entry.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      {entry.remarks ? (
                        <p className="text-xs text-muted-foreground">{entry.remarks}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="tabular-nums">{formatMoney(detail.subtotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discount</p>
                <p className="tabular-nums">{formatMoney(detail.discountAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Shipping
                  {detail.shippingMethodName ? ` (${detail.shippingMethodName})` : ""}
                </p>
                <p className="tabular-nums">{formatMoney(detail.shippingAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-medium tabular-nums">{formatMoney(detail.grandTotal)}</p>
              </div>
            </div>

            <OrderStatusActions
              payments={payments}
              onCollect={handleCollect}
              onRefund={handleRefund}
              nextStatuses={nextStatuses}
              status={status}
              onStatusChange={setStatus}
              remarks={remarks}
              onRemarksChange={setRemarks}
            />
          </div>
        ) : null}

        <CollectCodDialog
          open={collectOpen}
          onOpenChange={setCollectOpen}
          payment={activePayment}
        />
        <RefundDialog open={refundOpen} onOpenChange={setRefundOpen} payment={activePayment} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!status || mutation.isPending || !order || nextStatuses.length === 0}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Updating…" : "Update status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
