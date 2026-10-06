"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchCategoryList,
  flattenCategories,
} from "@/features/dashboard/admin/categories/api/categories";
import {
  createCoupon,
  deleteCoupon,
  updateCoupon,
} from "@/features/dashboard/admin/coupons/api/coupons";
import type { CouponFormValues } from "@/features/dashboard/admin/coupons/schemas";
import type {
  CouponListItem,
  CouponStatus,
  DialogMode,
  DiscountType,
} from "@/features/dashboard/admin/coupons/types";
import { toCouponErrorMessage, toIso } from "@/features/dashboard/admin/coupons/utils";
import { fetchProductList } from "@/features/dashboard/admin/products/api/products";

export function useCouponFormOptions({
  open,
  productSearch,
}: {
  open: boolean;
  productSearch: string;
}) {
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories", "options"],
    queryFn: () => fetchCategoryList(),
    enabled: open,
    staleTime: 60_000,
  });

  const productsQuery = useQuery({
    queryKey: ["coupon-products", productSearch],
    queryFn: () =>
      fetchProductList({
        page: 1,
        limit: 30,
        search: productSearch.trim() || undefined,
        includeInactive: true,
      }),
    enabled: open,
    staleTime: 15_000,
  });

  return {
    categoriesQuery,
    productsQuery,
    flattenedCategories: flattenCategories(categoriesQuery.data ?? []),
  };
}

export function useCouponFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: CouponListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CouponFormValues) => {
      const body = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description?.trim() || null,
        status: values.status as CouponStatus,
        discountType: values.discountType as DiscountType,
        discountValue:
          values.discountType === "FREE_SHIPPING" ? 0 : Number(values.discountValue ?? 0),
        minimumOrderAmount: values.minimumOrderAmount ?? null,
        maximumDiscountAmount: values.maximumDiscountAmount ?? null,
        usageLimit: values.usageLimit ?? null,
        usageLimitPerCustomer: values.usageLimitPerCustomer ?? null,
        startsAt: toIso(values.startsAt),
        expiresAt: toIso(values.expiresAt),
        isActive: values.isActive,
        applicableProductIds: values.applicableProductIds,
        applicableCategoryIds: values.applicableCategoryIds,
      };
      if (mode === "create") {
        await createCoupon(body);
        return;
      }
      if (!initialData?.id) throw new Error("Missing coupon id");
      await updateCoupon(initialData.id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success(mode === "create" ? "Coupon created" : "Coupon updated");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toCouponErrorMessage(err));
    },
  });
}

export function useCouponDeleteMutation({
  coupon,
  onSuccess,
}: {
  coupon: CouponListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!coupon) throw new Error("Missing coupon");
      await deleteCoupon(coupon.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toCouponErrorMessage(err));
    },
  });
}
