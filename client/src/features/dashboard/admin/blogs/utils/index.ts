import { DashboardApiError } from "@/lib/api/dashboard";
import type { BlogCategoryFormValues, BlogFormValues } from "@/features/dashboard/admin/blogs/schemas";
import type {
  BlogCategoryListItem,
  BlogListItem,
} from "@/features/dashboard/admin/blogs/types";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function blogCategoryFormDefaults(
  initialData?: BlogCategoryListItem,
): BlogCategoryFormValues {
  return {
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
  };
}

export function blogFormDefaults(initialData?: BlogListItem): BlogFormValues {
  return {
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    excerpt: initialData?.excerpt ?? "",
    content: initialData?.content ?? "",
    featuredImage: initialData?.featuredImage ?? "",
    categoryId: initialData?.categoryId ?? "",
    metaTitle: initialData?.metaTitle ?? "",
    metaDescription: initialData?.metaDescription ?? "",
    metaKeywords: initialData?.metaKeywords ?? "",
  };
}

export function toBlogErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function toBlogCategoryDeleteErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError && err.status === 409) {
    return "This category still has posts. Remove those first.";
  }
  return toBlogErrorMessage(err);
}
