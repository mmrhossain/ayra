"use client";

import { useStorefrontCounts } from "@/hooks/useStorefrontCounts";
import { DEFAULT_PUBLIC_SETTINGS } from "@/features/settings/defaults";
import { PublicSettingsProvider } from "@/features/settings/public-settings-provider";
import type { PublicSettings } from "@/features/settings/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function StorefrontClientWrapper({ children }: { children: React.ReactNode }) {
  // হুকটি এখন প্রোভাইডারের ভেতরে ক্লায়েন্ট কম্পোনেন্ট হিসেবে কল হচ্ছে
  useStorefrontCounts();

  return <>{children}</>;
}

export default function StorefrontProvider({
  initialPublicSettings = DEFAULT_PUBLIC_SETTINGS,
  children,
}: {
  initialPublicSettings?: PublicSettings;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PublicSettingsProvider initialSettings={initialPublicSettings}>
        <StorefrontClientWrapper>{children}</StorefrontClientWrapper>
      </PublicSettingsProvider>
    </QueryClientProvider>
  );
}
