"use client";

import { useStorefrontCounts } from "@/hooks/useStorefrontCounts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function StorefrontClientWrapper({ children }: { children: React.ReactNode }) {
  // হুকটি এখন প্রোভাইডারের ভেতরে ক্লায়েন্ট কম্পোনেন্ট হিসেবে কল হচ্ছে
  useStorefrontCounts();

  return <>{children}</>;
}

export default function StorefrontProvider({
  children,
}: {
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
      <StorefrontClientWrapper>{children}</StorefrontClientWrapper>
    </QueryClientProvider>
  );
}
