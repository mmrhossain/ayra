"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { money } from "@/features/dashboard/admin/orders/api/orders";
import { CollectCodDialog } from "@/features/dashboard/admin/payments/components/collect-cod-dialog";
import { RefundDialog } from "@/features/dashboard/admin/payments/components/refund-dialog";
import { usePaymentDetailQuery, useUpdateRefundStatusMutation } from "@/features/dashboard/admin/payments/hooks/use-payment-mutations";
import type { PaymentDetailDialogProps } from "@/features/dashboard/admin/payments/types";
import {
  isCodCollectable,
  isRefundable,
  paymentCustomerLabel,
  toPaymentErrorMessage,
} from "@/features/dashboard/admin/payments/utils";
import { statusColor } from "@/helpers";

export type { PaymentDetailDialogProps };

function formatJson(value: unknown): string {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function PaymentDetailDialog({ open, onOpenChange, payment }: PaymentDetailDialogProps) {
  const [collectOpen, setCollectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const query = usePaymentDetailQuery({ open, payment });
  const refundStatus = useUpdateRefundStatusMutation();

  const detail = query.data;
  const collectable = detail ? isCodCollectable(detail) : false;
  const refundedAmount = (detail?.refunds ?? [])
    .filter((refund) => refund.status !== "REJECTED")
    .reduce((sum, refund) => sum + Number(refund.amount), 0);
  const remainingRefundable = detail
    ? Math.max(0, Number(detail.amount) - refundedAmount)
    : 0;
  const refundable =
    detail !== undefined &&
    isRefundable(detail) &&
    remainingRefundable > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] min-w-0 flex-col overflow-hidden p-4 scrollbar-hide sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:p-6">
          <DialogHeader className="shrink-0">
            <DialogTitle className="break-words pr-8">Payment detail</DialogTitle>
            <DialogDescription>
              {payment
                ? `${payment.method} · ${payment.order?.orderNumber ?? payment.id}`
                : "Transaction details"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            {!payment ? (
              <p className="text-sm text-muted-foreground">No payment selected.</p>
            ) : query.isFetching && !detail ? (
              <div className="space-y-5 py-2" aria-busy="true" aria-live="polite">
                <span className="sr-only">Loading payment details</span>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ) : query.isError ? (
              <div role="alert" className="rounded-xl border border-destructive/30 p-4">
                <p className="text-sm">{toPaymentErrorMessage(query.error)}</p>
              </div>
            ) : detail ? (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium tabular-nums">{money(detail.amount)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span
                      className={`inline-flex w-fit items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${statusColor(detail.status)}`}
                    >
                      {detail.status}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Method</p>
                    <p className="text-sm">{detail.method}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Order</p>
                    <p className="break-words text-sm">{detail.order?.orderNumber ?? "—"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="break-words text-sm">{paymentCustomerLabel(detail)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Provider ref</p>
                    <p className="text-sm break-all">{detail.providerReference || "—"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="break-words text-sm">{new Date(detail.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Paid at</p>
                    <p className="break-words text-sm">
                      {detail.paidAt ? new Date(detail.paidAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>

                {collectable || refundable ? (
                  <div className="flex flex-wrap gap-2">
                    {collectable ? (
                      <Button type="button" size="sm" onClick={() => setCollectOpen(true)}>
                        Collect COD
                      </Button>
                    ) : null}
                    {refundable ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setRefundOpen(true)}
                      >
                        Refund
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {(detail.refunds?.length ?? 0) > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-medium">Refunds</p>
                    <div className="space-y-2">
                      {detail.refunds!.map((refund) => (
                        <div key={refund.id} className="rounded-lg border px-3 py-2 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium tabular-nums">
                              {money(refund.amount)} · {refund.status}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {refund.status === "PENDING" || refund.status === "APPROVED" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={refundStatus.isPending}
                                  onClick={() =>
                                    refundStatus.mutate({
                                      refundId: refund.id,
                                      status: "REJECTED",
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              ) : null}
                              {refund.status === "PENDING" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={refundStatus.isPending}
                                  onClick={() =>
                                    refundStatus.mutate({
                                      refundId: refund.id,
                                      status: "APPROVED",
                                    })
                                  }
                                >
                                  Approve
                                </Button>
                              ) : null}
                              {refund.status === "APPROVED" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={refundStatus.isPending}
                                  onClick={() =>
                                    refundStatus.mutate({
                                      refundId: refund.id,
                                      status: "PROCESSING",
                                    })
                                  }
                                >
                                  Processing
                                </Button>
                              ) : null}
                              {refund.status === "APPROVED" || refund.status === "PROCESSING" ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={refundStatus.isPending}
                                  onClick={() =>
                                    refundStatus.mutate({
                                      refundId: refund.id,
                                      status: "COMPLETED",
                                    })
                                  }
                                >
                                  Mark completed
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {refund.reason || "No reason"} ·{" "}
                            {new Date(refund.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(detail.events?.length ?? 0) > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-medium">Events</p>
                    <ol className="space-y-3 border-l pl-4">
                      {detail.events!.map((event) => (
                        <li key={event.id} className="relative">
                          <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                          <p className="text-sm font-medium">{event.eventType}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {(detail.transactions?.length ?? 0) > 0 ? (
                  <div>
                    <p className="mb-2 text-sm font-medium">Gateway transactions</p>
                    <div className="space-y-3">
                      {detail.transactions!.map((txn) => (
                        <div key={txn.id} className="rounded-lg border p-3">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <p className="font-medium">
                              {txn.status} · {money(txn.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {txn.transactionReference || txn.id}
                            </p>
                          </div>
                          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                            {formatJson(txn.gatewayResponse)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No gateway transactions on this payment.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <CollectCodDialog
        open={collectOpen}
        onOpenChange={setCollectOpen}
        payment={detail ?? payment}
      />
      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        payment={detail ?? payment}
        remainingAmount={remainingRefundable}
      />
    </>
  );
}
