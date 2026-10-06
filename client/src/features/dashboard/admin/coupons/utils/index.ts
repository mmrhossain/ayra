import { DashboardApiError } from "@/lib/api/dashboard";
import type { CouponFormValues } from "@/features/dashboard/admin/coupons/schemas";
import type { CouponListItem } from "@/features/dashboard/admin/coupons/types";

export function toCouponErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toIso(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date provided");
  }
  return d.toISOString();
}

export function defaultValues(initialData?: CouponListItem): CouponFormValues {
  return {
    code: initialData?.code ?? "",
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    status: initialData?.status ?? "ACTIVE",
    discountType: initialData?.discountType ?? "PERCENTAGE",
    discountValue:
      initialData?.discountValue == null
        ? undefined
        : Number(initialData.discountValue),
    minimumOrderAmount:
      initialData?.minimumOrderAmount == null
        ? undefined
        : Number(initialData.minimumOrderAmount),
    maximumDiscountAmount:
      initialData?.maximumDiscountAmount == null
        ? undefined
        : Number(initialData.maximumDiscountAmount),
    usageLimit: initialData?.usageLimit ?? undefined,
    usageLimitPerCustomer: initialData?.usageLimitPerCustomer ?? undefined,
    startsAt: toDatetimeLocal(initialData?.startsAt),
    expiresAt: toDatetimeLocal(initialData?.expiresAt),
    isActive: initialData?.isActive ?? true,
    applicableProductIds: initialData?.applicableProductIds ?? [],
    applicableCategoryIds: initialData?.applicableCategoryIds ?? [],
  } as unknown as CouponFormValues;
}
