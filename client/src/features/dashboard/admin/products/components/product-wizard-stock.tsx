"use client";

import Link from "next/link";
import { useMemo } from "react";

import { NumberInput } from "@/components/ui/number-input";
import type { VariantRow } from "@/features/dashboard/admin/products/types";
import { formatMoney } from "@/lib/format";

type Props = {
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
};

function qtyOf(value: string): number {
  const qty = Number(value);
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
}

function priceOf(value: string): number {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

export function ProductWizardStock({ rows, onRowsChange }: Props) {
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const qty = qtyOf(row.initialQty);
        acc.stock += qty;
        acc.amount += qty * priceOf(row.price);
        return acc;
      },
      { stock: 0, amount: 0 },
    );
  }, [rows]);

  const updateQty = (key: string, qty: string) => {
    onRowsChange(
      rows.map((row) => (row.key === key ? { ...row, initialQty: qty } : row)),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set the stock level for each variant. Fields are pre-filled with the current stock, so
        submitting an unchanged value does nothing. Leave a field blank to skip it. Submit applies
        the difference to MAIN immediately; you can still adjust later on{" "}
        <Link href="/admin/inventory" className="underline">
          Inventory
        </Link>
        .
      </p>
      {rows.length === 0 ? (
        <p className="rounded-xl border p-4 text-sm text-muted-foreground">
          Existing stock is adjusted on Inventory, not in this wizard.
        </p>
      ) : (
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3 font-medium">Variant</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Stock (MAIN)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b last:border-0">
                <td className="p-3">{row.label}</td>
                <td className="p-3 text-muted-foreground">{row.sku || "—"}</td>
                <td className="p-3">
                  <div className="max-w-40">
                    <NumberInput
                      placeholder="Qty"
                      value={row.initialQty === "" ? null : Number(row.initialQty)}
                      onChange={(value) =>
                        updateQty(row.key, value === null ? "" : String(value))
                      }
                      aria-label={`Stock quantity for ${row.label}`}
                      className="w-32"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current: {row.existingQty ?? 0}. Leave blank to skip.
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/40">
              <td className="p-3 font-medium" colSpan={2}>
                Total stock
              </td>
              <td className="p-3 font-medium tabular-nums">{totals.stock}</td>
            </tr>
            <tr className="bg-muted/40">
              <td className="p-3 font-medium" colSpan={2}>
                Amount
              </td>
              <td className="p-3 font-medium tabular-nums">
                {formatMoney(totals.amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      )}
    </div>
  );
}
