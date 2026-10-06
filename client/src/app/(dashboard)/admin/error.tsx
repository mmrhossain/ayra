"use client";

import { AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { DashboardApiError } from "@/lib/api/dashboard";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const status = error instanceof DashboardApiError ? error.status : undefined;
  const isForbidden = status === 403 || status === 401;

  useEffect(() => {
    // Log the error to an observability service (Sentry, LogRocket, etc.)
    console.error("Dashboard route error:", error);
  }, [error]);

  const handleRetry = () => {
    startTransition(() => {
      // Revalidate server components and retry rendering
      router.refresh();
      reset();
    });
  };

  return (
    <div
      role="alert"
      className="mx-auto my-8 max-w-lg rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-destructive/10 p-2 text-destructive">
          {isForbidden ? <Lock className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>
        <div>
          <h2 className="text-base font-semibold leading-none">
            {isForbidden ? "Access Denied" : "Something went wrong"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            {error.digest ? `Error ID: ${error.digest}` : "Server Error"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {isForbidden
          ? "You do not have the required permissions to view this dashboard section."
          : error.message || "An unexpected error occurred while loading this page."}
      </p>

      <div className="mt-5 flex items-center gap-2">
        {isForbidden ? (
          <>
            <Button asChild variant="default" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Back to home</Link>
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isPending}
          >
            {isPending ? "Retrying..." : "Try again"}
          </Button>
        )}
      </div>
    </div>
  );
}
