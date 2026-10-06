"use client";

import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CouponDeleteDialog } from "@/features/dashboard/admin/coupons/components/coupon-delete-dialog";
import { CouponFormDialog } from "@/features/dashboard/admin/coupons/components/couponDialog";
import { useCouponList } from "@/features/dashboard/admin/coupons/hooks/use-coupon-list";
import type { CouponListItem, CouponTableProps } from "@/features/dashboard/admin/coupons/types";
import { toCouponErrorMessage } from "@/features/dashboard/admin/coupons/utils";
import { formatDate, formatMoney } from "@/lib/format";

function formatDiscount(item: CouponListItem): string {
  const value = Number(item.discountValue);
  if (item.discountType === "PERCENTAGE") {
    return `${Number.isFinite(value) ? value : 0}%`;
  }
  if (item.discountType === "FREE_SHIPPING") {
    return "Free shipping";
  }
  if (!Number.isFinite(value)) return "FIXED";
  return formatMoney(value);
}

function usageLabel(item: CouponListItem): string {
  const used = item.usageCount ?? 0;
  if (item.usageLimit == null) return `${used} / —`;
  return `${used} / ${item.usageLimit}`;
}

export function CouponTable({ initialData }: CouponTableProps) {
  const [page, setPage] = useState(initialData.pagination.page);
  const [searchInput, setSearchInput] = useState("");

  // ✅ React 19 / Modern React Pattern: useEffect ছাড়া স্মুথ ডিবাউন্সড সার্চ
  const deferredSearch = useDeferredValue(searchInput.trim());

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCoupon, setEditingCoupon] = useState<CouponListItem | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<CouponListItem | null>(null);

  // সার্চ ভ্যালু ডিফারড হিসেবে হ্যান্ডেল করা
  const { query, items, pagination } = useCouponList({
    initialData,
    page,
    search: deferredSearch,
  });

  // ইনপুট টাইপ করার সাথে সাথে সার্চ ও পেজ হ্যান্ডলিং
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setPage(1); // ইনপুট বদলালে ১ম পেজে ফিল্টার হবে
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search coupon code or name"
          aria-label="Search coupons"
          className="max-w-sm"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{pagination.total} coupons</p>
          <Button
            type="button"
            onClick={() => {
              setFormMode("create");
              setEditingCoupon(undefined);
              setFormOpen(true);
            }}
          >
            Add Coupon
          </Button>
        </div>
      </div>

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">{toCouponErrorMessage(query.error)}</p>
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
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No coupons found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <p className="font-medium">{coupon.code}</p>
                      <p className="text-xs text-muted-foreground">{coupon.name}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{coupon.discountType}</TableCell>
                    <TableCell className="tabular-nums">{formatDiscount(coupon)}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {usageLabel(coupon)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(coupon.startsAt)} – {formatDate(coupon.expiresAt)}
                    </TableCell>
                    <TableCell>{coupon.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormMode("edit");
                            setEditingCoupon(coupon);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeletingCoupon(coupon);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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

      {/* Key প্রপ ব্যবহারের মাধ্যমে সঠিক ডায়ালগ রিম্যাউন্টিং ও ফ্রেশ স্টেট নিশ্চিত করা হয়েছে */}
      <CouponFormDialog
        key={formOpen ? `${formMode}-${editingCoupon?.id ?? "new"}` : "closed"}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={formMode === "edit" ? editingCoupon : undefined}
      />

      <CouponDeleteDialog
        key={deleteOpen ? (deletingCoupon?.id ?? "delete") : "delete-closed"}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        coupon={deletingCoupon}
      />
    </div>
  );
}
