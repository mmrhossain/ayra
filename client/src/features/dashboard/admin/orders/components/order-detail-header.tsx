import type { OrderDetailHeaderProps } from "@/features/dashboard/admin/orders/types";

export function OrderDetailHeader({
  customerLabel,
  customerEmail,
  status,
  paymentStatus,
  shippingText,
  billingText,
}: OrderDetailHeaderProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Customer</p>
          <p className="text-sm font-medium">{customerLabel}</p>
          {customerEmail ? (
            <p className="text-xs text-muted-foreground">{customerEmail}</p>
          ) : null}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="text-sm font-medium">{status}</p>
          <p className="text-xs text-muted-foreground">
            Payment: {paymentStatus ?? "—"}
          </p>
        </div>
      </div>

      {shippingText || billingText ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {shippingText ? (
            <div>
              <p className="text-xs text-muted-foreground">Shipping</p>
              <p className="text-sm">{shippingText}</p>
            </div>
          ) : null}
          {billingText ? (
            <div>
              <p className="text-xs text-muted-foreground">Billing</p>
              <p className="text-sm">{billingText}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
