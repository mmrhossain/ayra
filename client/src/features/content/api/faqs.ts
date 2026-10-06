/**
 * Public FAQ reads for the storefront. Uses the cache-friendly store-front client.
 * Admin FAQ CRUD lives in `@/features/dashboard/admin/faqs/api/faqs`.
 */
import { api } from "@/lib/api/store-front";
import type { Envelope, PublicFaqCategory } from "@/features/content/types";

export type { PublicFaqCategory, PublicFaqItem } from "@/features/content/types";

export async function fetchPublicFaqs(): Promise<PublicFaqCategory[]> {
  const res = await api.get<Envelope<PublicFaqCategory[]>>("/faqs");
  return res.data ?? [];
}
