import { DashboardApiError } from "@/lib/api/dashboard";
import type { BlogCategoryFormValues, BlogFormValues } from "@/features/dashboard/admin/blogs/schemas";
import type {
  BlogCategoryListItem,
  BlogListItem,
} from "@/features/dashboard/admin/blogs/types";

export function blogCategoryFormDefaults(
  initialData?: BlogCategoryListItem,
): BlogCategoryFormValues {
  return {
    name: initialData?.name ?? "",
  };
}

export function blogFormDefaults(initialData?: BlogListItem): BlogFormValues {
  return {
    title: initialData?.title ?? "",
    excerpt: initialData?.excerpt ?? "",
    content: initialData?.content ?? "",
    featuredImage: initialData?.featuredImage ?? "",
    featuredImagePublicId: initialData?.featuredImagePublicId ?? "",
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
