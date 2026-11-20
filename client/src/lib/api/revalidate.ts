"use server";

import { revalidateTag } from "next/cache";
import { dashboardApi, DashboardApiError, type Envelope } from "@/lib/api/dashboard";
import { hasAdminPermission, type AdminAccess, type AdminPermission } from "@/lib/admin-permissions";

const TAG_SCOPES = new Map<string, AdminPermission[]>([
  ["home", ["catalog", "content"]],
  ["brands", ["catalog"]],
  ["categories", ["catalog"]],
  ["collections", ["catalog"]],
  ["products", ["catalog"]],
  ["product", ["catalog"]],
  ["sliders", ["content"]],
  ["blogs", ["content"]],
  ["faqs", ["content"]],
  ["legal", ["content"]],
]);

export async function revalidateStorefrontTags(tags: string[]) {
  if (!Array.isArray(tags) || tags.length === 0 || tags.length > 20) return;
  const unique = [...new Set(tags)];
  const scopes = unique.map(tag => {
    if (typeof tag !== "string") return undefined;
    if (tag.length <= 256 && /^product:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) return ["catalog"] as const;
    return TAG_SCOPES.get(tag);
  });
  if (scopes.some(scope => !scope)) return;

  try {
    const { data } = await dashboardApi.get<Envelope<AdminAccess>>("/session/access");
    if (!scopes.every(scope => scope?.some(permission => hasAdminPermission(data, permission)))) return;
  } catch (error) {
    if (error instanceof DashboardApiError && (error.status === 401 || error.status === 403)) return;
    throw error;
  }
  for (const tag of unique) revalidateTag(tag, "max");
}
