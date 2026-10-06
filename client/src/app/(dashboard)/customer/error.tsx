"use client";

import Link from "next/link";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message || "";
  const isForbidden =
    /unauthorized|forbidden|401|403/i.test(message) ||
    message.toLowerCase().includes("insufficient");

  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
    >
      <h2 className="text-lg font-semibold">
        {isForbidden ? "Unauthorized" : "Something went wrong"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isForbidden
          ? "You do not have access to this customer area."
          : message || "Please try again."}
      </p>
      <div className="mt-4">
        {isForbidden ? (
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            Go home
          </Link>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
