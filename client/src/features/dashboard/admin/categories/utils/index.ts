import { DashboardApiError } from "@/lib/api/dashboard";
import type { CategoryFormValues } from "@/features/dashboard/admin/categories/schemas";
import type {
  CategoryListItem,
  FlatCategoryListItem,
} from "@/features/dashboard/admin/categories/types";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function flattenCategories(
  items: CategoryListItem[],
  depth = 0,
): FlatCategoryListItem[] {
  const result: FlatCategoryListItem[] = [];
  for (const item of items) {
    result.push({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      image: item.image,
      imagePublicId: item.imagePublicId,
      mobileImage: item.mobileImage,
      cardImage: item.cardImage,
      isActive: item.isActive,
      parentId: item.parentId,
      children: item.children,
      depth,
    });
    if (item.children?.length) {
      result.push(...flattenCategories(item.children, depth + 1));
    }
  }
  return result;
}

export function categoryFormDefaults(
  initialData?: CategoryListItem,
): CategoryFormValues {
  return {
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    parentId: initialData?.parentId ?? "",
    isActive: initialData?.isActive ?? true,
    image: initialData?.image ?? "",
    imagePublicId: initialData?.imagePublicId ?? "",
  };
}

export function parentCategoryOptions(
  categories: Array<CategoryListItem | FlatCategoryListItem>,
  currentId?: string,
): Array<CategoryListItem | FlatCategoryListItem> {
  const descendantIds = new Set<string>();
  const collectDescendants = (id: string) => {
    for (const cat of categories) {
      if (cat.parentId === id && !descendantIds.has(cat.id)) {
        descendantIds.add(cat.id);
        collectDescendants(cat.id);
      }
    }
  };
  if (currentId) collectDescendants(currentId);

  return categories.filter(
    (c) => c.id !== currentId && !descendantIds.has(c.id),
  );
}

export function toCategoryErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function toCategoryDeleteErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError && err.status === 409) {
    return "This category has products or subcategories. Remove those first.";
  }
  return toCategoryErrorMessage(err);
}
