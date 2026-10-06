import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CreateLegalBody,
  Envelope,
  LegalDocumentItem,
  LegalListParams,
  LegalListResult,
  UpdateLegalBody,
} from "@/features/dashboard/admin/legal/types";

export {
  LEGAL_STATUSES,
  LEGAL_TYPES,
} from "@/features/dashboard/admin/legal/types";

export type {
  CreateLegalBody,
  Envelope,
  LegalDocumentItem,
  LegalListParams,
  LegalListResult,
  LegalPagination,
  LegalStatus,
  LegalType,
  UpdateLegalBody,
} from "@/features/dashboard/admin/legal/types";

export {
  legalTypeLabel,
  toLegalErrorMessage,
} from "@/features/dashboard/admin/legal/utils";

const noStore = { cache: "no-store" as const };

export async function fetchLegalList(
  params: LegalListParams = {},
): Promise<LegalListResult> {
  const res = await dashboardApi.get<Envelope<LegalListResult>>(
    "/admin/legal",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        type: params.type,
      },
    },
  );
  return res.data;
}

export async function createLegalDocument(
  body: CreateLegalBody,
): Promise<LegalDocumentItem> {
  const res = await dashboardApi.post<Envelope<LegalDocumentItem>>(
    "/admin/legal",
    { body },
  );
  return res.data;
}

export async function updateLegalDocument(
  id: string,
  body: UpdateLegalBody,
): Promise<LegalDocumentItem> {
  const res = await dashboardApi.put<Envelope<LegalDocumentItem>>(
    `/admin/legal/${id}`,
    { body },
  );
  return res.data;
}

export async function publishLegalDocument(
  id: string,
): Promise<LegalDocumentItem> {
  const res = await dashboardApi.post<Envelope<LegalDocumentItem>>(
    `/admin/legal/${id}/publish`,
  );
  return res.data;
}
