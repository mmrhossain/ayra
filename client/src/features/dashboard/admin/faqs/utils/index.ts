import { DashboardApiError } from "@/lib/api/dashboard";
import type { FaqCategoryFormValues } from "@/features/dashboard/admin/faqs/schemas";
import type { FaqCategoryListItem } from "@/features/dashboard/admin/faqs/types";

export function faqCategoryFormDefaults(
  initialData?: FaqCategoryListItem,
): FaqCategoryFormValues {
  return {
    name: initialData?.name ?? "",
    sortOrder: initialData?.sortOrder ?? (undefined as unknown as number),
    isActive: initialData?.isActive ?? true,
  };
}

export function toFaqErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function toFaqCategoryDeleteErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError && err.status === 409) {
    return "This category still has FAQ items. Remove those first.";
  }
  return toFaqErrorMessage(err);
}
