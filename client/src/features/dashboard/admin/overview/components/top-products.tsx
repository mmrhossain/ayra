import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TopProductsResult } from "@/features/dashboard/admin/overview/api/analytics";

export function TopProductsTable({ data }: { data: TopProductsResult }) {
  const money = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: data.currency,
    maximumFractionDigits: 2,
  });

  if (data.products.length === 0) {
    return (
      <Card className="h-full min-w-0">
        <CardHeader>
          <CardTitle>Top products</CardTitle>
          <CardDescription>
            Net product sales by delivery date, less approved returns.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <p className="py-6 text-center text-sm text-muted-foreground">
            No product sales in this period yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>
          Net product sales by delivery date, less approved returns. Shipping
          and tax excluded.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Net qty</TableHead>
              <TableHead className="text-right">Net sales</TableHead>
              <TableHead className="text-right">Est. gross profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.products.map((product) => (
              <TableRow key={product.sku}>
                <TableCell className="font-medium">
                  <div>{product.productName}</div>
                  <div className="text-xs text-muted-foreground">
                    {product.sku}
                    {product.quantityReturned > 0
                      ? ` · ${product.quantityReturned} returned`
                      : ""}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {product.netQuantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money.format(product.netProductSales)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {product.costDataComplete ? (
                    money.format(product.estimatedGrossProfit)
                  ) : (
                    <span
                      className="text-muted-foreground"
                      title={`Cost known for ${product.costCoveragePercent.toFixed(1)}% of sales`}
                    >
                      Incomplete
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
