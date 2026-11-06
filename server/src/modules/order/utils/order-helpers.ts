import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../../../generated/prisma/client.ts";
import { isPrismaCode } from "../../../common/utils/prisma-error.ts";
import type { CheckoutInput } from "../../cart/types.ts";
import type { StatusHistoryEntry } from "../types.ts";

type AddressDb = Pick<PrismaClient, "$queryRaw" | "address">;

type MoneyInput = number | string | { toNumber: () => number };

export const RESERVATION_TTL_MS = 48 * 60 * 60 * 1000;
export const ORDER_NUMBER_ATTEMPTS = 3;

const moneyToNumber = (value: MoneyInput): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
};

export const toMinor = (value: MoneyInput): number => Math.round(moneyToNumber(value) * 100);

export const fromMinor = (minor: number): number => minor / 100;

export const roundMoney = (value: MoneyInput): number => fromMinor(toMinor(value));

/**
 * Allocate an integer minor-unit total across weighted lines using the
 * largest-remainder method. The remainder is assigned deterministically by the
 * largest fractional part and then by line index, so the allocations always
 * sum exactly to `totalMinor`.
 */
export const allocateMinor = (totalMinor: number, weights: number[]): number[] => {
  const safeTotal = Math.max(0, Math.trunc(totalMinor));
  const safeWeights = weights.map((weight) => Math.max(0, weight));
  const weightTotal = safeWeights.reduce((sum, weight) => sum + weight, 0);
  if (safeTotal === 0 || weightTotal === 0) {
    return safeWeights.map(() => 0);
  }

  const raw = safeWeights.map((weight) => (safeTotal * weight) / weightTotal);
  const allocations = raw.map((value) => Math.floor(value));
  let remainder = safeTotal - allocations.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; remainder > 0; i += 1) {
    const target = order[i % order.length]!.index;
    allocations[target] = (allocations[target] ?? 0) + 1;
    remainder -= 1;
  }

  return allocations;
};

export type LineMoneyInput = {
  unitPrice: MoneyInput;
  quantity: number;
};

export type LineMoneyAllocation = {
  grossMinor: number;
  discountMinor: number;
  taxMinor: number;
  /** Gross minus discount minus tax when prices include tax. */
  netSalesMinor: number;
};

/**
 * Allocate product discounts and tax to order lines. Shipping is deliberately
 * excluded: free-shipping discounts are a shipping adjustment, not a product
 * discount.
 */
export const allocateLineMoney = (
  lines: LineMoneyInput[],
  discountAmount: MoneyInput,
  tax: { pricesIncludeTax: boolean; taxRatePercent: number },
): LineMoneyAllocation[] => {
  const gross = lines.map(
    (line) => toMinor(line.unitPrice) * Math.max(0, Math.trunc(line.quantity)),
  );
  const grossTotal = gross.reduce((sum, value) => sum + value, 0);
  const discountTotal = Math.min(Math.max(0, toMinor(discountAmount)), grossTotal);
  const discount = allocateMinor(discountTotal, gross);
  const net = gross.map((value, index) => value - (discount[index] ?? 0));
  const netTotal = net.reduce((sum, value) => sum + value, 0);

  const rate = Math.max(0, tax.taxRatePercent);
  const taxTotal = tax.pricesIncludeTax
    ? Math.round((netTotal * rate) / (100 + rate))
    : Math.round((netTotal * rate) / 100);
  const taxAllocations = allocateMinor(taxTotal, net);

  return gross.map((grossMinor, index) => {
    const taxMinor = taxAllocations[index] ?? 0;
    return {
      grossMinor,
      discountMinor: discount[index] ?? 0,
      taxMinor,
      netSalesMinor:
        grossMinor -
        (discount[index] ?? 0) -
        (tax.pricesIncludeTax ? taxMinor : 0),
    };
  });
};

const rangeShare = (
  totalMinor: number,
  totalQuantity: number,
  startQuantity: number,
  quantity: number,
): number => {
  if (totalQuantity <= 0 || quantity <= 0) return 0;
  const safeTotal = Math.max(0, totalMinor);
  const start = Math.max(0, Math.min(totalQuantity, startQuantity));
  const end = Math.max(start, Math.min(totalQuantity, startQuantity + quantity));
  return (
    Math.floor((end * safeTotal) / totalQuantity) -
    Math.floor((start * safeTotal) / totalQuantity)
  );
};

export type LineSnapshotSource = {
  unitPrice: MoneyInput;
  quantity: number;
  discountAmount: MoneyInput;
  taxAmount: MoneyInput;
  allocationVersion?: number;
};

export type OrderMoneySnapshot = {
  subtotal: MoneyInput;
  discountAmount: MoneyInput;
  taxAmount: MoneyInput;
  pricesIncludeTax: boolean;
};

export type LineRangeAmounts = {
  grossMinor: number;
  discountMinor: number;
  taxMinor: number;
  /** Net merchandise: gross minus discount. Tax may be included in it. */
  netMerchandiseMinor: number;
  /** Product sales excluding tax, used by the reporting layer. */
  netSalesMinor: number;
  /** Cash refundable for this quantity (shipping excluded). */
  cashRefundMinor: number;
  /** Null when the original unit cost is unknown. */
  costMinor: number | null;
  legacyFallback: boolean;
};

/**
 * Resolve the recorded discount/tax for an order line. New orders persist the
 * allocation on OrderItem. Legacy orders only have order-level amounts, so a
 * deterministic pro-rata fallback is used and flagged.
 */
export const resolveLineTotals = (
  order: OrderMoneySnapshot,
  item: LineSnapshotSource,
): { discountMinor: number; taxMinor: number; legacyFallback: boolean } => {
  const lineGrossMinor = toMinor(item.unitPrice) * Math.max(0, item.quantity);
  const recordedDiscount = Math.max(0, toMinor(item.discountAmount));
  const recordedTax = Math.max(0, toMinor(item.taxAmount));
  const orderDiscount = Math.max(0, toMinor(order.discountAmount));
  const orderTax = Math.max(0, toMinor(order.taxAmount));
  const subtotalMinor = Math.max(0, toMinor(order.subtotal));

  const isLegacy = (item.allocationVersion ?? 0) < 1;
  const needsDiscountFallback =
    isLegacy && orderDiscount > 0 && recordedDiscount === 0;
  const needsTaxFallback = isLegacy && orderTax > 0 && recordedTax === 0;
  if (!needsDiscountFallback && !needsTaxFallback) {
    return {
      discountMinor: recordedDiscount,
      taxMinor: recordedTax,
      legacyFallback: false,
    };
  }

  const ratio = subtotalMinor > 0 ? lineGrossMinor / subtotalMinor : 0;
  return {
    discountMinor: needsDiscountFallback
      ? Math.floor(orderDiscount * ratio)
      : recordedDiscount,
    taxMinor: needsTaxFallback ? Math.floor(orderTax * ratio) : recordedTax,
    legacyFallback: true,
  };
};

/**
 * Amounts for returning `quantity` units starting after `alreadyReturned`
 * units of the same line. Cumulative floor allocation guarantees that
 * returning the full quantity reverses exactly the recorded totals once.
 */
export const lineAmountsForRange = (
  order: OrderMoneySnapshot,
  item: LineSnapshotSource & { costPrice?: MoneyInput | null },
  alreadyReturned: number,
  quantity: number,
): LineRangeAmounts => {
  const totals = resolveLineTotals(order, item);
  const unitMinor = toMinor(item.unitPrice);
  const grossMinor = unitMinor * quantity;
  const discountMinor = rangeShare(
    totals.discountMinor,
    item.quantity,
    alreadyReturned,
    quantity,
  );
  const taxMinor = rangeShare(
    totals.taxMinor,
    item.quantity,
    alreadyReturned,
    quantity,
  );
  const netMerchandiseMinor = grossMinor - discountMinor;
  const costMinor =
    item.costPrice === null || item.costPrice === undefined
      ? null
      : toMinor(item.costPrice) * quantity;

  return {
    grossMinor,
    discountMinor,
    taxMinor,
    netMerchandiseMinor,
    netSalesMinor:
      netMerchandiseMinor - (order.pricesIncludeTax ? taxMinor : 0),
    cashRefundMinor:
      netMerchandiseMinor + (order.pricesIncludeTax ? 0 : taxMinor),
    costMinor,
    legacyFallback: totals.legacyFallback,
  };
};


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
      currency: true,
      createdAt: true,
      refunds: {
        select: {
          id: true,
          amount: true,
          status: true,
          reason: true,
          refundedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" as const },
      },
    },
  },
  shipments: {
    select: {
      id: true,
      shipmentNumber: true,
      courierProvider: true,
      status: true,
      trackingNumber: true,
      shippingCost: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
      items: { select: { quantity: true } },
      trackingEvents: {
        select: {
          status: true,
          location: true,
          description: true,
          eventTime: true,
        },
        orderBy: { eventTime: "desc" as const },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export const customerOrderDetailInclude = {
  items: true,
  addresses: true,
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  events: {
    select: { eventType: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
  payments: {
    select: {
      id: true,
      method: true,
      status: true,
      amount: true,
      currency: true,
      createdAt: true,
      refunds: {
        select: {
          id: true,
          amount: true,
          status: true,
          reason: true,
          refundedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" as const },
      },
    },
  },
  returnRequests: {
    include: { items: true },
    orderBy: { requestedAt: "desc" as const },
  },
  shipments: {
    select: {
      id: true,
      shipmentNumber: true,
      courierProvider: true,
      status: true,
      trackingNumber: true,
      pickupRequestedAt: true,
      pickedUpAt: true,
      shippedAt: true,
      deliveredAt: true,
      returnedAt: true,
      createdAt: true,
      items: { select: { orderItemId: true, quantity: true } },
      trackingEvents: {
        select: {
          status: true,
          location: true,
          description: true,
          eventTime: true,
        },
        orderBy: { eventTime: "asc" as const },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export const omitItemCostPrice = <
  T extends { costPrice?: unknown; costSource?: unknown; costCapturedAt?: unknown },
>(
  item: T,
) => {
  const {
    costPrice: _costPrice,
    costSource: _costSource,
    costCapturedAt: _costCapturedAt,
    ...rest
  } = item;
  return rest;
};

export const omitOrderCostPrice = <
  T extends {
    items?: Array<{
      costPrice?: unknown;
      costSource?: unknown;
      costCapturedAt?: unknown;
    }> | null;
  },
>(
  order: T,
) => {
  type OrderItem = NonNullable<T["items"]>[number];
  return {
    ...order,
    items: ((order.items ?? []) as OrderItem[]).map(
      (item): Omit<OrderItem, "costPrice" | "costSource" | "costCapturedAt"> =>
        omitItemCostPrice(item),
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
  divisionCode: a.divisionCode ?? null,
  districtCode: a.districtCode ?? null,
  upazilaCode: a.upazilaCode ?? null,
  addressLine1: a.addressLine1,
  addressLine2: a.addressLine2 ?? null,
});

const normalizeAddressField = (value?: string | null) =>
  (value ?? "").trim().toLowerCase();

export const saveCheckoutAddressIfNew = async (
  db: AddressDb,
  customerProfileId: string | null | undefined,
  address: CheckoutInput["billingAddress"]
) => {
  if (!customerProfileId) return;

  const existing = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "address"
    WHERE "customerProfileId" = ${customerProfileId}
      AND lower(btrim("addressLine1")) = ${normalizeAddressField(address.addressLine1)}
      AND lower(btrim(district)) = ${normalizeAddressField(address.district)}
      AND lower(btrim(COALESCE("postalCode", ''))) = ${normalizeAddressField(address.postalCode)}
      AND lower(btrim(phone)) = ${normalizeAddressField(address.phone)}
    LIMIT 1
  `;

  if (existing.length > 0) return;

  await db.address.create({
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
      divisionCode: address.divisionCode ?? null,
      districtCode: address.districtCode ?? null,
      upazilaCode: address.upazilaCode ?? null,
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
  tax: { pricesIncludeTax: boolean; taxRatePercent: number } = {
    pricesIncludeTax: true,
    taxRatePercent: 0,
  },
) => {
  const subtotalMinor = toMinor(subtotal);
  const discountMinor = Math.min(Math.max(0, toMinor(discountAmount)), subtotalMinor);
  const taxableMinor = Math.max(0, subtotalMinor - discountMinor);
  const rate = Math.max(0, tax.taxRatePercent);
  // Tax-inclusive prices already contain the tax, so it is broken out for
  // reporting but never added to grandTotal a second time.
  const taxMinor = tax.pricesIncludeTax
    ? Math.round((taxableMinor * rate) / (100 + rate))
    : Math.round((taxableMinor * rate) / 100);
  const shippingMinor =
    coupon?.discountType === "FREE_SHIPPING" ? 0 : toMinor(shippingAmountQuoted);
  const grandTotalMinor =
    subtotalMinor -
    discountMinor +
    (tax.pricesIncludeTax ? 0 : taxMinor) +
    shippingMinor;

  return {
    discountAmount: fromMinor(discountMinor),
    taxAmount: fromMinor(taxMinor),
    shippingAmount: fromMinor(shippingMinor),
    grandTotal: fromMinor(grandTotalMinor),
  };
};
