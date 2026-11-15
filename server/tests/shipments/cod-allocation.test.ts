import { describe, expect, it } from "vitest";
import { calculateShipmentCodAmount } from "../../src/modules/shipments/cod-allocation.ts";

const order = {
  subtotal: 200,
  discountAmount: 0,
  taxAmount: 0,
  pricesIncludeTax: true,
  shippingAmount: 10,
  grandTotal: 210,
};

const items = [
  {
    id: "item-1",
    unitPrice: 100,
    quantity: 2,
    discountAmount: 0,
    taxAmount: 0,
    allocationVersion: 1,
  },
];

describe("shipment COD allocation", () => {
  it("allocates shipping once and splits merchandise COD across partial shipments", () => {
    const firstAmount = calculateShipmentCodAmount({
      order,
      items,
      requested: new Map([["item-1", 1]]),
      shippedQuantities: new Map(),
      alreadyAllocatedMinor: 0,
      hasPriorShipment: false,
      isCod: true,
    });
    const secondAmount = calculateShipmentCodAmount({
      order,
      items,
      requested: new Map([["item-1", 1]]),
      shippedQuantities: new Map([["item-1", 1]]),
      alreadyAllocatedMinor: 11_000,
      hasPriorShipment: true,
      isCod: true,
    });

    expect(firstAmount).toBe(110);
    expect(secondAmount).toBe(100);
    expect(firstAmount + secondAmount).toBe(order.grandTotal);
  });

  it("does not allocate COD to paid orders or exceed the remaining balance", () => {
    expect(
      calculateShipmentCodAmount({
        order,
        items,
        requested: new Map([["item-1", 1]]),
        shippedQuantities: new Map(),
        alreadyAllocatedMinor: 0,
        hasPriorShipment: false,
        isCod: false,
      }),
    ).toBe(0);

    expect(
      calculateShipmentCodAmount({
        order,
        items,
        requested: new Map([["item-1", 1]]),
        shippedQuantities: new Map(),
        alreadyAllocatedMinor: 20_000,
        hasPriorShipment: true,
        isCod: true,
      }),
    ).toBe(10);
  });
});
