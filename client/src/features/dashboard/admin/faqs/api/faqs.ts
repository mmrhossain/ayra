/**
 * Admin FAQ category/item CRUD. Authenticated dashboard client only.
 * Public FAQ GET lives in `@/features/content/api`.
 */
import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CreateFaqCategoryBody,
  CreateFaqItemBody,
  Envelope,
  FaqCategoryListItem,
  FaqItemListItem,
} from "@/features/dashboard/admin/faqs/types";

export type {
  Envelope,
  FaqCategoryListItem,
  FaqItemListItem,
  CreateFaqCategoryBody,
  CreateFaqItemBody,
} from "@/features/dashboard/admin/faqs/types";

export {
  toFaqCategoryDeleteErrorMessage,
  toFaqErrorMessage,
} from "@/features/dashboard/admin/faqs/utils";

const noStore = { cache: "no-store" as const };

export async function fetchFaqCategories(): Promise<FaqCategoryListItem[]> {
  const res = await dashboardApi.get<Envelope<FaqCategoryListItem[]>>(
    "/admin/faq-categories",
    noStore,
  );
  return res.data ?? [];
}

export async function createFaqCategory(
  body: CreateFaqCategoryBody,
): Promise<FaqCategoryListItem> {
  const res = await dashboardApi.post<Envelope<FaqCategoryListItem>>(
    "/admin/faq-categories",
    { body },
  );
  return res.data;
}

export async function updateFaqCategory(
  id: string,
  body: Partial<CreateFaqCategoryBody>,
): Promise<FaqCategoryListItem> {
  const res = await dashboardApi.put<Envelope<FaqCategoryListItem>>(
    `/admin/faq-categories/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteFaqCategory(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/faq-categories/${id}`);
}

export async function fetchFaqItems(
  categoryId?: string,
): Promise<FaqItemListItem[]> {
  const res = await dashboardApi.get<Envelope<FaqItemListItem[]>>(
    "/admin/faq-items",
    {
      ...noStore,
      params: { categoryId: categoryId || undefined },
    },
  );
  return res.data ?? [];
}

export async function createFaqItem(
  body: CreateFaqItemBody,
): Promise<FaqItemListItem> {
  const res = await dashboardApi.post<Envelope<FaqItemListItem>>(
    "/admin/faq-items",
    { body },
  );
  return res.data;
}

export async function updateFaqItem(
  id: string,
  body: Partial<CreateFaqItemBody>,
): Promise<FaqItemListItem> {
  const res = await dashboardApi.put<Envelope<FaqItemListItem>>(
    `/admin/faq-items/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteFaqItem(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/faq-items/${id}`);
}
