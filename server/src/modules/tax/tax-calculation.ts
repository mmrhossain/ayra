import { allocateMinor, fromMinor, toMinor } from "../order/utils/order-helpers.ts";
import type { TaxClassLookup } from "./tax.service.ts";

type TaxLine = { unitPrice: number | string | { toNumber(): number }; quantity: number; taxClassId: string | null; discountEligible?: boolean };

export const calculateTaxTotals = (
  lines: TaxLine[], discountAmount: number,
  classes: TaxClassLookup[],
  behavior: { taxEnabled: boolean },
  shippingQuoted = 0, freeShipping = false,
) => {
  const byId = new Map(classes.map(row => [row.id, row]));
  const gross = lines.map(line => toMinor(line.unitPrice) * line.quantity);
  const subtotalMinor = gross.reduce((sum, amount) => sum + amount, 0);
  const discountWeights = gross.map((amount, index) => lines[index]!.discountEligible === false ? 0 : amount);
  const eligibleMinor = discountWeights.reduce((sum, amount) => sum + amount, 0);
  const discountMinor = Math.min(eligibleMinor, Math.max(0, toMinor(discountAmount)));
  const discounts = allocateMinor(discountMinor, discountWeights);
  // Round each line once so persisted snapshots exactly reconcile to the order.
  const allocations = lines.map((line, index) => {
    const assigned = line.taxClassId ? byId.get(line.taxClassId) : undefined;
    const taxRate = behavior.taxEnabled && assigned?.isActive ? assigned.rate : 0;
    const taxable = Math.max(0, gross[index]! - discounts[index]!);
    const taxMinor = Math.round(taxable * taxRate / 100);
    return {
      grossMinor: gross[index]!, discountMinor: discounts[index]!, taxMinor,
      taxClassName: assigned?.name ?? null, taxRate
    };
  });
  const taxMinor = allocations.reduce((sum, line) => sum + line.taxMinor, 0);
  const shippingMinor = freeShipping ? 0 : Math.max(0, toMinor(shippingQuoted));
  return {
    subtotal: fromMinor(subtotalMinor), discountAmount: fromMinor(discountMinor),
    taxAmount: fromMinor(taxMinor), shippingAmount: fromMinor(shippingMinor),
    grandTotal: fromMinor(subtotalMinor - discountMinor + taxMinor + shippingMinor),
    taxRates: [...new Set(allocations.map(line => line.taxRate))].sort((a, b) => a - b),
    allocations,
  };
};
