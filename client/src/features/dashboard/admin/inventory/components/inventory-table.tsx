"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockAdjustDialog } from "@/features/dashboard/admin/inventory/components/stock-adjust-dialog";
import { useInventoryList } from "@/features/dashboard/admin/inventory/hooks/use-inventory-list";
import type {
  InventoryListItem,
  InventoryTableProps,
} from "@/features/dashboard/admin/inventory/types";
import { toInventoryErrorMessage } from "@/features/dashboard/admin/inventory/utils";
import { warehouseLabel } from "@/features/dashboard/admin/warehouses/api/warehouses";

export function InventoryTable({
  initialData,
  initialVariantId = "",
  initialSearch = "",
}: InventoryTableProps) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [warehouseId, setWarehouseId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryListItem | null>(null);
  const variantId = initialVariantId;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const {
    query,
    items,
    pagination,
    warehouses,
    lowStockThreshold,
  } = useInventoryList({
    initialData,
    page,
    warehouseId,
    lowStockOnly,
    search,
    variantId,
    initialSearch,
    initialVariantId,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search product or SKU"
            aria-label="Search inventory"
            className="max-w-sm"
          />
          <Select
            value={warehouseId || "__all__"}
            onValueChange={(v) => {
              setWarehouseId(v === "__all__" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-full sm:w-56"
              aria-label="Filter by warehouse"
            >
              <SelectValue placeholder="All warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All warehouses</SelectItem>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {warehouseLabel(wh)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={lowStockOnly}
              onCheckedChange={(checked) => {
                setLowStockOnly(checked === true);
                setPage(1);
              }}
              aria-label="Low stock only"
            />
            Low stock only
            <span className="text-muted-foreground">(below 10)</span>
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          {pagination.total} records
        </p>
      </div>

      {query.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">{toInventoryErrorMessage(query.error)}</p>
        </div>
      ) : null}

      <div className="rounded-xl border">
        {query.isFetching && !query.isFetched ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>On hand</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No inventory found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const out = item.quantityAvailable <= 0;
                  const low =
                    !out && item.quantityAvailable < lowStockThreshold;
                  const highlighted = variantId && item.variantId === variantId;
                  return (
                    <TableRow
                      key={item.id}
                      className={
                        highlighted
                          ? "bg-primary/5"
                          : out || low
                            ? "bg-destructive/5"
                            : undefined
                      }
                    >
                      <TableCell className="font-medium">
                        {item.variant.product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.variant.sku}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.warehouse.name}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {item.quantityOnHand}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {item.quantityReserved}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span className="inline-flex items-center gap-2">
                          {item.quantityAvailable}
                          {out ? (
                            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                              Out
                            </span>
                          ) : low ? (
                            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                              Low
                            </span>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustItem(item);
                            setAdjustOpen(true);
                          }}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <StockAdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={adjustItem}
      />
    </div>
  );
}
