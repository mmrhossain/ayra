import { DashboardApiError } from "@/lib/api/dashboard";
import { formatMoney } from "@/lib/format";
import type {
  AdminReturnRequest,
  OrderAddress,
  OrderDetail,
  OrderListItem,
  OrderStatus,
} from "@/features/dashboard/admin/orders/types";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "REFUNDED", "CANCELLED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function toOrderErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export const money = formatMoney;

export function customerLabel(order: OrderListItem): string {
  const user = order.customerProfile?.user;
  return (
    user?.name?.trim() ||
    user?.email?.trim() ||
    order.customerProfile?.customerCode ||
    "—"
  );
}

export function itemCount(order: Pick<OrderListItem, "items">): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function pickOrderAddress(
  order: Pick<OrderDetail, "addresses" | "billingAddress" | "shippingAddress">,
  type: "SHIPPING" | "BILLING",
): OrderAddress | null {
  const fromList = order.addresses?.find((a) => a.type === type);
  if (fromList) return fromList;
  return type === "SHIPPING"
    ? (order.shippingAddress ?? null)
    : (order.billingAddress ?? null);
}

export function returnCustomerLabel(request: AdminReturnRequest): string {
  const user = request.order?.customerProfile?.user;
  return (
    user?.name?.trim() ||
    user?.email?.trim() ||
    request.order?.customerProfile?.customerCode ||
    "—"
  );
}

export function formatAddress(
  address: OrderAddress | null | undefined,
): string | null {
  if (!address) return null;
  return [
    address.fullName,
    address.phone,
    address.addressLine1,
    address.addressLine2,
    address.thana ?? address.area,
    address.district ?? address.city,
    address.division ?? address.state,
    address.postalCode,
    address.country,
  ]
    .filter((part) => part && String(part).trim())
    .join(", ");
}
