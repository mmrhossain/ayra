import type { OrderDetailLinesProps } from "@/features/dashboard/admin/orders/types";
import { money } from "@/features/dashboard/admin/orders/utils";

export function OrderDetailLines({ items }: OrderDetailLinesProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Line items</p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Cost</th>
              <th className="px-3 py-2 text-right font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">
                  {item.productName}
                  {item.variantName ? (
                    <span className="block text-xs text-muted-foreground">
                      {item.variantName}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{item.sku}</td>
                <td className="px-3 py-2 tabular-nums">{item.quantity}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {item.costPrice == null ? "—" : money(item.costPrice)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {money(item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
