import { DashboardApiError } from "@/lib/api/dashboard";
import type { CheckoutAddress, CustomerOrder } from "@/features/dashboard/customer/orders/types";

export function toCustomerApiError(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function pickOrderAddress(
  order: Pick<CustomerOrder, "addresses" | "billingAddress" | "shippingAddress">,
  type: "SHIPPING" | "BILLING",
): CheckoutAddress | null {
  const fromList = order.addresses?.find((a) => a.type === type);
  if (fromList) return fromList;
  return type === "SHIPPING"
    ? (order.shippingAddress ?? null)
    : (order.billingAddress ?? null);
}

export function formatCheckoutAddress(
  address: CheckoutAddress | null | undefined,
): string | null {
  if (!address) return null;
  return [
    address.fullName,
    address.phone,
    address.addressLine1,
    address.addressLine2,
    address.thana,
    address.district,
    address.division,
    address.postalCode,
    address.country,
  ]
    .filter((part) => part && String(part).trim())
    .join(", ");
}
