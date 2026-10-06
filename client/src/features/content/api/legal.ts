/**
 * Public published legal-document reads for the storefront.
 * Admin legal CRUD lives in `@/features/dashboard/admin/legal/api/legal`.
 */
import { api } from "@/lib/api/store-front";
import type {
  Envelope,
  LegalType,
  PublishedLegalDocument,
} from "@/features/content/types";

export { LEGAL_TYPES } from "@/features/content/types";
export type {
  LegalType,
  PublishedLegalDocument,
} from "@/features/content/types";

export async function fetchPublishedLegal(
  type: LegalType,
): Promise<PublishedLegalDocument> {
  const res = await api.get<Envelope<PublishedLegalDocument>>(`/legal/${type}`);
  return res.data;
}
