"use client";

import { Button } from "@/components/ui/button";
import { DashboardApiError } from "@/lib/api/dashboard";
import Link from "next/link";

export default function VendorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const status = error instanceof DashboardApiError ? error.status : undefined;
  const isForbidden = status === 403 || status === 401;

  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 p-6"
    >
      <h2 className="text-lg font-semibold">
        {isForbidden ? "Unauthorized" : "Something went wrong"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isForbidden
          ? "You do not have access to this vendor area."
          : error.message || "Please try again."}
      </p>
      <div className="mt-4 flex gap-2">
        {isForbidden ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/">Go home</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
