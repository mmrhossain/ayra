"use client";

import { RouteErrorFallback } from "@/components/shared/route-error-fallback";

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <RouteErrorFallback reset={reset} />;
}
