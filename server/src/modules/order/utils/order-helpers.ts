import { randomUUID } from "node:crypto";
import type { TransactionClient } from "../../../lib/prisma.ts";
import { isPrismaCode } from "../../../common/utils/prisma-error.ts";
import type { CheckoutInput } from "../../cart/types.ts";
import type { StatusHistoryEntry } from "../types.ts";

export const TAX_RATE = 0;
export const RESERVATION_TTL_MS = 48 * 60 * 60 * 1000;
export const ORDER_NUMBER_ATTEMPTS = 3;

export const orderDetailInclude = {
  items: true,
  addresses: true,
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  events: { orderBy: { createdAt: "asc" as const } },
  payments: {
    select: {
      id: true,
      method: true,
      status: true,
      amount: true,
      createdAt: true,
    },
  },
} as const;

export const customerOrderDetailInclude = {
  items: true,
  addresses: true,
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  events: { orderBy: { createdAt: "asc" as const } },
  payments: {
    select: {
      id: true,
      method: true,
      status: true,
      amount: true,
      createdAt: true,
    },
  },
  returnRequests: {
    include: { items: true },
    orderBy: { requestedAt: "desc" as const },
  },
} as const;

export const omitItemCostPrice = <T extends { costPrice?: unknown }>(item: T) => {
  const { costPrice: _costPrice, ...rest } = item;
  return rest;
};

export const omitOrderCostPrice = <
  T extends { items?: Array<{ costPrice?: unknown }> | null },
>(
  order: T,
) => {
  type OrderItem = NonNullable<T["items"]>[number];
  return {
    ...order,
    items: ((order.items ?? []) as OrderItem[]).map(
      (item): Omit<OrderItem, "costPrice"> => omitItemCostPrice(item),
    ),
  };
};

export const toCustomerStatusHistory = (
  entries: StatusHistoryEntry[]
) =>
  entries.map((entry) => ({
    id: entry.id,
    status: entry.status,
    remarks: entry.remarks,
    createdAt: entry.createdAt,
  }));

export const isOrderNumberConflict = (err: unknown): boolean => {
  if (!isPrismaCode(err, "P2002")) return false;
  const target = (err as { meta?: { target?: unknown } }).meta?.target;
  if (Array.isArray(target)) return target.includes("orderNumber");
  if (typeof target === "string") return target.includes("orderNumber");
  return false;
};

export const generateOrderNumber = () => {
  const id = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `ORD-${id}`;
};

export const formatVariantName = (
  variant: {
    sku: string;
    attributes?: Array<{ attributeValue: { value: string } }>;
  }
) => {
  const values = (variant.attributes ?? [])
    .map((attr) => attr.attributeValue.value)
    .filter(Boolean);
  return values.length > 0 ? values.join(" / ") : null;
};

export const toOrderAddress = (
    a: CheckoutInput["billingAddress"],
    type: "BILLING" | "SHIPPING"
) => ({
  type,
  fullName: a.fullName,
  phone: a.phone,
  email: a.email ?? null,
  country: a.country,
  division: a.division,
  district: a.district,
  thana: a.thana ?? null,
  postalCode: a.postalCode ?? null,
  addressLine1: a.addressLine1,
  addressLine2: a.addressLine2 ?? null,
});

const normalizeAddressField = (value?: string | null) =>
  (value ?? "").trim().toLowerCase();

export const saveCheckoutAddressIfNew = async (
  tx: TransactionClient,
  customerProfileId: string | null | undefined,
  address: CheckoutInput["billingAddress"]
) => {
  if (!customerProfileId) return;

  const existing = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "Address"
    WHERE "customerProfileId" = ${customerProfileId}
      AND lower(btrim("addressLine1")) = ${normalizeAddressField(address.addressLine1)}
      AND lower(btrim(district)) = ${normalizeAddressField(address.district)}
      AND lower(btrim(COALESCE("postalCode", ''))) = ${normalizeAddressField(address.postalCode)}
      AND lower(btrim(phone)) = ${normalizeAddressField(address.phone)}
    LIMIT 1
  `;

  if (existing.length > 0) return;

  await tx.address.create({
    data: {
      customerProfileId,
      fullName: address.fullName,
      phone: address.phone,
      email: address.email ?? null,
      country: address.country,
      division: address.division,
      district: address.district,
      thana: address.thana ?? null,
      postalCode: address.postalCode ?? null,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? null,
    },
  });
};

export const computeCheckoutTotals = (
  subtotal: number,
  discountAmount: number,
  coupon: { discountType: string } | null,
  shippingAmountQuoted: number,
) => {
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shippingAmount =
    coupon?.discountType === "FREE_SHIPPING" ? 0 : shippingAmountQuoted;
  const grandTotal = subtotal - discountAmount + taxAmount + shippingAmount;
  return { taxAmount, shippingAmount, grandTotal };
};
