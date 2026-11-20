import { heroFrameClass } from "@/features/slider/components/hero-layout";

export const HomeHeroSkeleton = () => (
  <div aria-hidden="true" className={heroFrameClass + " w-full animate-pulse bg-muted motion-reduce:animate-none"} />
);

export const HomeCategoriesSkeleton = () => (
  <div aria-hidden="true" className="container">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="min-w-0 pb-2">
            <div className="aspect-square animate-pulse bg-muted motion-reduce:animate-none" />
            <div className="mx-auto mt-4 h-5 w-2/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="mt-1 h-[1.5px]" />
          </div>
        ))}
      </div>
    </div>
);

const HomePageSkeleton = () => (
  <div role="status" aria-label="Loading store" className="space-y-[var(--storefront-section-gap)]">
    <HomeHeroSkeleton />
    <HomeCategoriesSkeleton />
  </div>
);

export default HomePageSkeleton;
