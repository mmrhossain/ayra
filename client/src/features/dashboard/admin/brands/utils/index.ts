import { DashboardApiError } from "@/lib/api/dashboard";
import type { BrandFormValues } from "@/features/dashboard/admin/brands/schemas";
import type { BrandListItem } from "@/features/dashboard/admin/brands/types";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function brandFormDefaults(initialData?: BrandListItem): BrandFormValues {
  return {
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    description: initialData?.description ?? "",
    isActive: initialData?.isActive ?? true,
    logo: initialData?.logo ?? "",
    logoPublicId: initialData?.logoPublicId ?? "",
  };
}

export function toBrandErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function toBrandDeleteErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError && err.status === 409) {
    return "This brand has products. Remove those first.";
  }
  return toBrandErrorMessage(err);
}

export function isBrandSlugConflict(err: unknown): boolean {
  return (
    err instanceof DashboardApiError &&
    err.status === 409 &&
    /slug/i.test(err.message)
  );
}
