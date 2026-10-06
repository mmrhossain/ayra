import { dashboardApi } from "@/lib/api/dashboard";
import type {
  AttributeListItem,
  AttributeValueItem,
  Envelope,
} from "@/features/dashboard/admin/attributes/types";

export type {
  AttributeListItem,
  AttributeValueItem,
  Envelope,
} from "@/features/dashboard/admin/attributes/types";

export {
  isColorAttribute,
  toAttributeDeleteErrorMessage,
  toAttributeErrorMessage,
  toAttributeValueDeleteErrorMessage,
} from "@/features/dashboard/admin/attributes/utils";

const noStore = { cache: "no-store" as const };

export async function fetchAttributeList(): Promise<AttributeListItem[]> {
  const res = await dashboardApi.get<Envelope<AttributeListItem[]>>(
    "/attributes",
    noStore,
  );
  return res.data ?? [];
}

export async function createAttribute(
  name: string,
): Promise<AttributeListItem> {
  const res = await dashboardApi.post<Envelope<AttributeListItem>>(
    "/admin/attributes",
    { body: { name } },
  );
  return res.data;
}

export async function updateAttribute(
  id: string,
  name: string,
): Promise<AttributeListItem> {
  const res = await dashboardApi.put<Envelope<AttributeListItem>>(
    `/admin/attributes/${id}`,
    { body: { name } },
  );
  return res.data;
}

export async function deleteAttribute(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/attributes/${id}`);
}

export async function createAttributeValue(
  attributeId: string,
  value: string,
  color?: string,
): Promise<AttributeValueItem> {
  const res = await dashboardApi.post<Envelope<AttributeValueItem>>(
    `/admin/attributes/${attributeId}/values`,
    { body: { value, ...(color ? { color } : {}) } },
  );
  return res.data;
}

export async function createAttributeValues(
  attributeId: string,
  values: Array<{ value: string; color?: string }>,
): Promise<AttributeValueItem[]> {
  const res = await dashboardApi.post<Envelope<AttributeValueItem[]>>(
    `/admin/attributes/${attributeId}/values/bulk`,
    { body: { values } },
  );
  return res.data ?? [];
}

export async function updateAttributeValue(
  id: string,
  value: string,
  color?: string,
): Promise<AttributeValueItem> {
  const res = await dashboardApi.put<Envelope<AttributeValueItem>>(
    `/admin/attribute-values/${id}`,
    { body: { value, ...(color ? { color } : {}) } },
  );
  return res.data;
}

export async function deleteAttributeValue(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/attribute-values/${id}`);
}
