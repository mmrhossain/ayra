import {
  fromMinor,
  lineAmountsForRange,
  toMinor,
  type LineSnapshotSource,
  type OrderMoneySnapshot,
} from "../order/utils/order-helpers.ts";

type OrderLine = LineSnapshotSource & { id: string };

export function calculateShipmentCodAmount({
  order,
  items,
  requested,
  shippedQuantities,
  alreadyAllocatedMinor,
  hasPriorShipment,
  isCod,
}: {
  order: OrderMoneySnapshot & {
    grandTotal: number | string | { toNumber: () => number };
    shippingAmount: number | string | { toNumber: () => number };
  };
  items: OrderLine[];
  requested: Map<string, number>;
  shippedQuantities: Map<string, number>;
  alreadyAllocatedMinor: number;
  hasPriorShipment: boolean;
  isCod: boolean;
}): number {
  if (!isCod) return 0;

  const merchandiseMinor = items.reduce((total, item) => {
    const quantity = requested.get(item.id) ?? 0;
    if (quantity <= 0) return total;

    return (
      total +
      lineAmountsForRange(
        order,
        item,
        shippedQuantities.get(item.id) ?? 0,
        quantity,
      ).cashRefundMinor
    );
  }, 0);

  const shippingMinor =
    !hasPriorShipment ? toMinor(order.shippingAmount) : 0;
  const remainingOrderBalance = Math.max(
    0,
    toMinor(order.grandTotal) - alreadyAllocatedMinor,
  );

  return fromMinor(
    Math.min(merchandiseMinor + shippingMinor, remainingOrderBalance),
  );
}
