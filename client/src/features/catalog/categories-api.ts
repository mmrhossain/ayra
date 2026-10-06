/**
 * Public category tree/list for the storefront. Store-front client.
 * Admin category CRUD lives in `@/features/dashboard/admin/categories/api/categories`.
 */
import { api } from "@/lib/api/store-front/index";
import { CategoryListItem } from "./types";

type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

type FetchOptions = {
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
};

export type FlatCategoryListItem = CategoryListItem & { depth: number };

export function flattenCategories(items: CategoryListItem[], depth = 0): FlatCategoryListItem[] {
  const result: FlatCategoryListItem[] = [];
  for (const item of items) {
    result.push({
      id: item.id,
      name: item.name,
      parentSlug: item.parentSlug,
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

export async function fetchCategoryList(options?: {
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}): Promise<CategoryListItem[]> {
  return getCategories(options);
}

export async function getCategories(options?: FetchOptions): Promise<CategoryListItem[]> {
  const { cache = "force-cache", next } = options || {};
  const tags = Array.from(new Set(["categories", ...(next?.tags || [])]));

  const revalidate = next?.revalidate ?? 60;

  try {
    const res = await api.get<Envelope<CategoryListItem[]>>("/categories", {
      cache,
      next: {
        revalidate,
        tags,
      },
    });

    return res.data ?? [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryListItem> {
  try {
    const res = await api.get<Envelope<CategoryListItem>>(`/categories/${slug}`);
    return res.data;
  } catch {
    throw new Error("Category not found");
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryListItem | null> {
  if (!slug) return null;
  try {
    return await fetchCategoryBySlug(slug);
  } catch {
    return null;
  }
}
