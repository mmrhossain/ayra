import { cache } from "react";

import { fetchPublicSettings } from "@/features/settings/api";
import { DEFAULT_PUBLIC_SETTINGS } from "@/features/settings/defaults";

export const fetchPublicSettingsOrDefault = cache(async () => {
  try {
    return await fetchPublicSettings();
  } catch (error) {
    console.error("Could not load public platform settings", error);
    return DEFAULT_PUBLIC_SETTINGS;
  }
});
