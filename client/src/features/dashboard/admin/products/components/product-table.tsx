"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkActionBar } from "@/features/dashboard/admin/products/components/bulk-actions.bar";
import { DeleteDialog } from "@/features/dashboard/admin/products/components/delete.dialog";
import { useProductList } from "@/features/dashboard/admin/products/hooks/use-product-list";
import type { ProductListItem, ProductTableProps } from "@/features/dashboard/admin/products/types";
import {
  productPriceRange,
  productStockSum,
  toErrorMessage,
} from "@/features/dashboard/admin/products/utils";
import { EmptyState } from "@/features/dashboard/admin/shared/components/empty-state";
import { ResponsiveTable } from "@/features/dashboard/admin/shared/components/responsive-table";
import { RowActions } from "@/features/dashboard/admin/shared/components/row-actions";

const BDT = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function formatPriceRange(product: ProductListItem): string {
  const range = productPriceRange(product);
  if (!range) return "—";
  if (range.min === range.max) return BDT.format(range.min);
  return `${BDT.format(range.min)} – ${BDT.format(range.max)}`;
}

function stockLabel(product: ProductListItem): string {
  if (product.variants.length === 0) return "—";
  const sum = productStockSum(product);
  return sum === 0 ? "Out" : String(sum);
}

function defaultVariantId(product: ProductListItem): string | undefined {
  return product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id;
}

export function ProductTable({ initialData }: ProductTableProps) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductListItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
      setSelected(new Set());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const { query, items, pagination, hasCategories } = useProductList({
    initialData,
    page,
    search,
  });

  // Selection only spans the current page; it is cleared whenever the page or
  // search changes so ids from a previous view are never acted on.
  const pageIds = items.map((product) => product.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products"
          aria-label="Search products"
          className="max-w-sm"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{pagination.total} products</p>
          <Button asChild>
            <Link href="/admin/products/new">Add product</Link>
          </Button>
        </div>
      </div>

      <BulkActionBar ids={[...selected]} onClear={clearSelection} />

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toErrorMessage(query.error)}</p>
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
          <ResponsiveTable>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all products"
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      title="No products yet"
                      body={
                        hasCategories
                          ? "Add a product to start selling."
                          : "Add a category before creating your first product."
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((product) => {
                  const imageUrl = product.images?.[0]?.imageUrl;
                  const variantId = defaultVariantId(product);
                  const live = product.status === "ACTIVE";
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(product.id)}
                          onCheckedChange={() => toggleOne(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                      <TableCell data-label="Image">
                        <div className="relative h-12 w-14 overflow-hidden rounded-md bg-gray-50 dark:bg-zinc-900 border">
                          <Image
                            src={imageUrl || "https://placehold.jp/160x96.png"}
                            alt={product.name}
                            fill
                            sizes="100px"
                            className="object-contain"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium" data-label="Name">
                        {product.name}
                      </TableCell>
                      <TableCell data-label="Status">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            live
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {product.status === "ACTIVE"
                            ? "Live"
                            : product.status === "ARCHIVED"
                              ? "Archived"
                              : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell
                        className="tabular-nums text-muted-foreground"
                        data-label="Variants"
                      >
                        {product.variants.length}
                      </TableCell>
                      <TableCell className="tabular-nums" data-label="Price">
                        {formatPriceRange(product)}
                      </TableCell>
                      <TableCell className="tabular-nums" data-label="Stock">
                        {stockLabel(product)}
                      </TableCell>
                      <TableCell data-label="Featured">
                        {product.isFeatured ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Featured
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right" data-label="Actions">
                        <RowActions
                          label={`Actions for ${product.name}`}
                          actions={[
                            {
                              label: "Edit",
                              href: `/admin/products/${product.id}/edit`,
                            },
                            {
                              label: "Manage variants",
                              href: `/admin/products/${product.id}/edit?step=2`,
                            },
                            ...(variantId
                              ? [
                                  {
                                    label: "Adjust stock",
                                    href: `/admin/inventory?variantId=${variantId}`,
                                  },
                                ]
                              : []),
                            {
                              label: "Delete",
                              variant: "destructive" as const,
                              onSelect: () => {
                                setDeletingProduct(product);
                                setDeleteOpen(true);
                              },
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </ResponsiveTable>
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
            onClick={() => {
              clearSelection();
              setPage((p) => Math.max(1, p - 1));
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages || query.isFetching}
            onClick={() => {
              clearSelection();
              setPage((p) => p + 1);
            }}
          >
            Next
          </Button>
        </div>
      </div>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} product={deletingProduct} />
    </div>
  );
}
