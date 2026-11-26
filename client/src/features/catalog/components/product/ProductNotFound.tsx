import Link from "next/link";
import { ArrowLeft, ArrowRight, House, PackageSearch, ShoppingBag } from "lucide-react";

const ProductNotFound = ({ slug }: { slug?: string }) => {
  const productLabel = slug
    ?.split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <section className="container storefront-page-start mx-auto min-h-[calc(100svh-var(--header-height,112px))] max-w-6xl pb-10 sm:pb-14">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm text-sky-color sm:mb-7">
        <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/shop" className="transition-colors hover:text-foreground">Shop</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-foreground">Product unavailable</span>
      </nav>

      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-border-color bg-background shadow-sm md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-muted/60 p-8 sm:min-h-72 md:min-h-[25rem]">
          <div aria-hidden="true" className="absolute -left-12 -top-16 size-64 rounded-full border border-border-color/70" />
          <div aria-hidden="true" className="absolute -bottom-24 -right-16 size-72 rounded-full border border-border-color/70" />
          <span aria-hidden="true" className="absolute select-none text-[9rem] font-black leading-none tracking-tighter text-foreground/[0.035] sm:text-[12rem]">
            404
          </span>
          <div className="relative flex size-28 items-center justify-center rounded-2xl border border-border-color bg-background shadow-sm sm:size-32">
            <PackageSearch aria-hidden="true" className="size-12 text-primary sm:size-14" strokeWidth={1.5} />
            <span className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full border-4 border-background bg-danger text-white">
              <span className="text-lg font-semibold leading-none">!</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-danger/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-danger" />
            Product unavailable
          </span>
          <h1 className="mt-5 text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
            We can’t find this product
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-sky-color sm:text-base">
            This product may have moved or been removed. {productLabel ? `“${productLabel}” is no longer available at this link.` : "Try browsing the shop to find something you’ll love."}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ShoppingBag aria-hidden="true" className="size-4" />
              Browse all products
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border-color bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <House aria-hidden="true" className="size-4" />
              Go to homepage
            </Link>
          </div>

          <div className="mt-7 flex items-center gap-2 border-t border-border-color pt-5 text-sm text-sky-color">
            <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
            <span>Looking for something specific?</span>
            <Link href="/shop" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Search the shop
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductNotFound;
