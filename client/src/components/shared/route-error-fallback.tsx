"use client";

import { cn } from "@/lib/utils";

export function RouteErrorFallback({ reset, className }: { reset: () => void; className?: string }) {
  return (
    <div className={cn("flex min-h-screen flex-col items-center justify-center text-center", className)}>
      <h2 className="text-2xl font-bold text-red-600">
        Something went wrong!
      </h2>
      <p className="mt-2 text-red-500">Please try again later.</p>
      <button
        onClick={reset}
        className="mt-4 rounded bg-primary px-4 py-2 text-white hover:bg-btn-hover"
      >
        Retry
      </button>
    </div>
  );
}
