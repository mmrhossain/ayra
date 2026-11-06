import { api } from "@/lib/api/store-front";
import type { PublicSettings, SettingsEnvelope } from "@/features/settings/types";

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const res = await api.get<SettingsEnvelope<PublicSettings>>(
    "/settings/public",
    { cache: "no-store" },
  );
  return res.data;
}
