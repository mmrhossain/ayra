"use client";
import { AlertTriangle, ArrowRight, House, RefreshCw, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative flex min-h-[calc(100svh-var(--header-height,112px))] items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background"
      />

      <div className="relative w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-bold tracking-[0.16em] text-foreground sm:mb-8">
          <ShoppingBag aria-hidden="true" className="size-5 text-primary" />
          AYRA ONLINE STORE
        </div>

        <section className="overflow-hidden rounded-2xl border border-border-color bg-background shadow-xl shadow-black/5">
          <div className="grid md:grid-cols-[0.85fr_1.15fr]">
            <div className="relative flex min-h-48 items-center justify-center overflow-hidden bg-muted p-8 sm:min-h-60 md:min-h-[25rem]">
              <div
                aria-hidden="true"
                className="absolute size-56 rounded-full border border-border-color sm:size-72"
              />
              <div
                aria-hidden="true"
                className="absolute size-40 rounded-full border border-border-color sm:size-56"
              />
              <div className="relative flex size-24 items-center justify-center rounded-2xl border border-border-color bg-background shadow-md sm:size-28">
                <AlertTriangle
                  aria-hidden="true"
                  className="size-11 text-primary sm:size-12"
                  strokeWidth={1.6}
                />
              </div>
              <span
                aria-hidden="true"
                className="absolute bottom-5 right-5 rounded-full border border-border-color bg-background px-3 py-1 text-xs font-semibold tracking-wide text-sky-color"
              >
                SYSTEM NOTICE
              </span>
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-danger/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-danger" />
                Unexpected error
              </span>
              <h1 className="mt-5 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                We hit a snag while loading the store
              </h1>
              <p className="mt-3 text-sm leading-6 text-sky-color sm:text-base">
                The page ran into an unexpected problem. You can try loading it again or return to
                the shop and keep browsing.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <RefreshCw aria-hidden="true" className="size-4" />
                  Try again
                </button>
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border-color bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <House aria-hidden="true" className="size-4" />
                  Return to homepage
                </Link>
              </div>

              <Link
                href="/shop"
                className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Continue shopping
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>

              {error.digest ? (
                <p className="mt-5 border-t border-border-color pt-4 text-xs text-sky-color">
                  Reference ID: <span className="font-mono">{error.digest}</span>
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-sky-color">
          If this keeps happening, please try again in a little while.
        </p>
      </div>
    </main>
  );
}
