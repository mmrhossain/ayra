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

const BDT = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

export function TopProductsTable({ data }: { data: TopProductsResult }) {
  if (data.products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top products</CardTitle>
          <CardDescription>Highest revenue this period</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">
            No product sales in this period yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>Highest revenue this period</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.products.map((product) => (
              <TableRow key={product.sku}>
                <TableCell className="font-medium">
                  {product.productName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.sku}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {product.quantity}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {BDT.format(product.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
