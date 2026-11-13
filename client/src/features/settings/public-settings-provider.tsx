"use client";

import { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchPublicSettings } from "@/features/settings/api";
import type { PublicSettings } from "@/features/settings/types";

export const PUBLIC_SETTINGS_QUERY_KEY = ["public-settings"] as const;
const PublicSettingsContext = createContext<PublicSettings | null>(null);

export function PublicSettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: PublicSettings;
  children: React.ReactNode;
}) {
  const query = useQuery({
    queryKey: PUBLIC_SETTINGS_QUERY_KEY,
    queryFn: fetchPublicSettings,
    initialData: initialSettings,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (query.error) {
      console.error("Could not refresh public platform settings", query.error);
    }
  }, [query.error]);

  return (
    <PublicSettingsContext.Provider value={query.data ?? initialSettings}>
      {children}
    </PublicSettingsContext.Provider>
  );
}

export function usePublicSettings(): PublicSettings {
  const settings = useContext(PublicSettingsContext);
  if (!settings) {
    throw new Error("usePublicSettings must be used within PublicSettingsProvider");
  }
  return settings;
}
