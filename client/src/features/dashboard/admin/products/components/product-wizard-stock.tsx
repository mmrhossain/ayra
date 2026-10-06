"use client";

import Link from "next/link";

import { Input } from "@/components/ui/input";
import type { VariantRow } from "@/features/dashboard/admin/products/types";

type Props = {
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
};

export function ProductWizardStock({ rows, onRowsChange }: Props) {
  const updateQty = (key: string, qty: number) => {
    onRowsChange(
      rows.map((row) => (row.key === key ? { ...row, initialQty: qty } : row))
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Optional. Leave 0 to skip. Submit creates a pending restock — approve it on{" "}
        <Link href="/admin/inventory" className="underline">
          Inventory
        </Link>
        . This step never auto-approves.
      </p>
      {rows.length === 0 ? (
        <p className="rounded-xl border p-4 text-sm text-muted-foreground">
          Existing stock is adjusted on Inventory, not in this wizard.
        </p>
      ) : (
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-3 font-medium">Variant</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Initial qty (MAIN)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b last:border-0">
                <td className="p-3">{row.label}</td>
                <td className="p-3 text-muted-foreground">{row.sku || "—"}</td>
                <td className="p-3">
                  <div className="max-w-40">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={row.initialQty}
                      onChange={(e) =>
                        updateQty(row.key, Math.max(0, Number(e.target.value) || 0))
                      }
                      aria-label={`Initial quantity for ${row.label}`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    0 in MAIN — add initial qty?
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
