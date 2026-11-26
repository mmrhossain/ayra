import Link from "next/link";
import { ArrowRight, House, ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-[calc(100dvh-2rem)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-4xl">
        <section className="grid overflow-hidden rounded-2xl border border-border-color bg-background shadow-xl shadow-black/5 md:grid-cols-[0.8fr_1.2fr]">
          <div className="relative flex min-h-52 items-center justify-center overflow-hidden bg-muted p-8 sm:min-h-64 md:min-h-[25rem]">
            <div aria-hidden="true" className="absolute size-56 rounded-full border border-border-color sm:size-72" />
            <div aria-hidden="true" className="absolute size-40 rounded-full border border-border-color sm:size-52" />
            <div className="relative flex size-24 items-center justify-center rounded-2xl border border-border-color bg-background shadow-md sm:size-28">
              <ShieldX aria-hidden="true" className="size-12 text-primary sm:size-14" strokeWidth={1.5} />
            </div>
            <span aria-hidden="true" className="absolute bottom-5 right-5 rounded-full border border-border-color bg-background px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
              ACCOUNT ACCESS
            </span>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-destructive" />
              Access restricted
            </span>
            <h1 className="mt-5 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              This area isn’t available to your account
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              Your account doesn’t have permission to open this page. If you need access for your work, ask an administrator to update your staff permissions.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <House aria-hidden="true" className="size-4" />
                Back to the store
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
