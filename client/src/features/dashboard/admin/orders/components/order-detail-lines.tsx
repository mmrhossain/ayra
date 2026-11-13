import type { OrderDetailLinesProps } from "@/features/dashboard/admin/orders/types";
import { money } from "@/features/dashboard/admin/orders/utils";

export function OrderDetailLines({ items }: OrderDetailLinesProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Line items</p>
      <div className="space-y-2 md:hidden">
        {items.map((item) => (
          <article key={item.id} className="min-w-0 rounded-lg border p-3">
            <p className="break-words text-sm font-medium">{item.productName}</p>
            {item.variantName ? (
              <p className="break-words text-xs text-muted-foreground">
                {item.variantName}
              </p>
            ) : null}
            <p className="break-all text-xs text-muted-foreground">SKU: {item.sku}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Quantity</dt>
                <dd className="tabular-nums">{item.quantity}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cost</dt>
                <dd className="tabular-nums">
                  {item.costPrice == null ? "—" : money(item.costPrice)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Price</dt>
                <dd className="tabular-nums">{money(item.unitPrice)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
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
