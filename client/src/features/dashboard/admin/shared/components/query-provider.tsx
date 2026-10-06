"use client";

import { DashboardApiError } from "@/lib/api/dashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const isAuthError = (error: Error) =>
  error instanceof DashboardApiError &&
  (error.status === 401 || error.status === 403);

export function DashboardQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            throwOnError: isAuthError,
          },
          mutations: {
            throwOnError: isAuthError,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
