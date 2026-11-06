import { dashboardApi } from "@/lib/api/dashboard";
import type {
  AdminSettingGroup,
  SettingsEnvelope,
} from "@/features/dashboard/admin/settings/types";

export async function fetchAdminSettings(): Promise<AdminSettingGroup[]> {
  const res = await dashboardApi.get<SettingsEnvelope<AdminSettingGroup[]>>(
    "/admin/settings",
    { cache: "no-store" },
  );
  return res.data;
}

export async function updateSettingsGroup(
  group: string,
  values: Record<string, unknown>,
): Promise<AdminSettingGroup> {
  const res = await dashboardApi.patch<SettingsEnvelope<AdminSettingGroup>>(
    `/admin/settings/${group}`,
    { body: { values } },
  );
  return res.data;
}
