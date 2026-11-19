import { dashboardApi } from "@/lib/api/dashboard";
import type { Envelope } from "@/lib/api/http";
export type TaxClass = { id: string; name: string; code: string; rate: number; isActive: boolean };
export const taxClassesKey = ["admin-tax-classes"] as const;
export async function fetchTaxClasses() {
  return (await dashboardApi.get<Envelope<TaxClass[]>>("/admin/tax-classes", { cache: "no-store" })).data;
}
export async function saveTaxClass(input: Omit<TaxClass, "id">, id?: string) {
  return id
    ? dashboardApi.put<Envelope<TaxClass>>("/admin/tax-classes/" + encodeURIComponent(id), { body: input })
    : dashboardApi.post<Envelope<TaxClass>>("/admin/tax-classes", { body: input });
}
export async function deleteTaxClass(id: string) {
  await dashboardApi.delete("/admin/tax-classes/" + encodeURIComponent(id));
}
