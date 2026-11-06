import type { CategoryListItem } from "../types";

export function categoryShopHref(
  category: Pick<CategoryListItem, "slug" | "path" | "parentSlug">,
): string {
  if (category.path) return `/shop/${category.path}`;
  if (category.parentSlug) return `/shop/${category.parentSlug}/${category.slug}`;
  return `/shop/${category.slug}`;
}
