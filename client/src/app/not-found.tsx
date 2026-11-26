import Link from "next/link";
import { ArrowRight, House, SearchX, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background" />

      <div className="relative w-full max-w-4xl">
        <section className="grid overflow-hidden rounded-2xl border border-border-color bg-background shadow-xl shadow-black/5 md:grid-cols-[0.85fr_1.15fr]">
          <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-muted p-8 sm:min-h-72 md:min-h-[26rem]">
            <span aria-hidden="true" className="absolute select-none text-[9rem] font-black leading-none tracking-tighter text-foreground/[0.04] sm:text-[12rem]">
              404
            </span>
            <div aria-hidden="true" className="absolute size-56 rounded-full border border-border-color sm:size-72" />
            <div className="relative flex size-28 items-center justify-center rounded-2xl border border-border-color bg-background shadow-md sm:size-32">
              <SearchX aria-hidden="true" className="size-12 text-primary sm:size-14" strokeWidth={1.5} />
            </div>
            <span className="absolute bottom-5 right-5 rounded-full border border-border-color bg-background px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
              PAGE NOT FOUND
            </span>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              We couldn’t find that page
            </span>
            <h1 className="mt-5 text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
              This page seems to have moved
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              The link may be outdated, or the page may no longer be available. Browse the shop to find what you’re looking for.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ShoppingBag aria-hidden="true" className="size-4" />
                Browse products
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border-color bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <House aria-hidden="true" className="size-4" />
                Go to homepage
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
