import { dashboardApi } from "@/lib/api/dashboard";
import type { Envelope } from "@/lib/api/http";
import type {
  GeoDistrict,
  GeoDivision,
  GeoEntity,
  GeoUnion,
  GeoUpazila,
} from "../types/models";

const noStore = { cache: "no-store" as const };

async function fetchList(
  path: string,
  params?: Record<string, string>,
): Promise<GeoEntity[]> {
  const res = await dashboardApi.get<Envelope<GeoEntity[]>>(path, {
    ...noStore,
    ...(params ? { params } : {}),
  });
  return res.data ?? [];
}

export function fetchDivisions(): Promise<GeoDivision[]> {
  return fetchList("/geo/divisions");
}

export function fetchDistricts(divisionCode: string): Promise<GeoDistrict[]> {
  return fetchList("/geo/districts", { divisionCode });
}

export function fetchUpazilas(districtCode: string): Promise<GeoUpazila[]> {
  return fetchList("/geo/upazilas", { districtCode });
}

export function fetchUnions(upazilaCode: string): Promise<GeoUnion[]> {
  return fetchList("/geo/unions", { upazilaCode });
}
