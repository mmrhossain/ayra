import { DashboardApiError } from "@/lib/api/dashboard";
import type { SliderFormValues } from "@/features/dashboard/admin/sliders/schemas";
import type { SliderListItem } from "@/features/dashboard/admin/sliders/types";

export function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toIso(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function defaultValues(initialData?: SliderListItem): SliderFormValues {
  return {
    title: initialData?.title ?? "",
    imageUrl: initialData?.imageUrl ?? "",
    imagePublicId: initialData?.imagePublicId ?? "",
    mobileImageUrl: initialData?.mobileImageUrl ?? "",
    mobileImagePublicId: initialData?.mobileImagePublicId ?? "",
    redirectUrl: initialData?.redirectUrl ?? "",
    startDate: toDatetimeLocal(initialData?.startDate),
    endDate: toDatetimeLocal(initialData?.endDate),
    priority: String(initialData?.priority ?? 0),
    isActive: initialData?.isActive ?? true,
  };
}

export function toSliderErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
