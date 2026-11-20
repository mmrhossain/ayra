import { Suspense, use } from "react";
import { heroFrameClass } from "@/features/slider/components/hero-layout";
import CategoriesGrid from "@/features/catalog/components/category/CategoriesGrid";
import HomeProductSection from "@/features/catalog/components/product/HomeProductSection";
import SliderCarousel from "@/features/slider/components/SliderCarousel";
import { HomeCategoriesSkeleton, HomeHeroSkeleton } from "../skeleton/HomePageSkeleton";
import type { HomePayload } from "../types";

type HomePageProps = {
  data: Promise<HomePayload | null>;
  sliders: Promise<HomePayload["sliders"] | null>;
  storeName: string;
};

function HomeHero({ data, sliders }: Pick<HomePageProps, "data" | "sliders">) {
  const activeSliders = use(sliders);
  const banners = activeSliders ?? use(data)?.sliders ?? [];
  return (
    <section>
      {banners.length ? (
        <div className="w-full overflow-hidden">
          <SliderCarousel sliders={banners} />
        </div>
      ) : (
        <div className={heroFrameClass + " relative flex w-full items-center justify-center overflow-hidden bg-gray-100 text-gray-400"}>
          No banners available
        </div>
      )}
    </section>
  );
}

function HomeSections({ promise }: { promise: HomePageProps["data"] }) {
  const data = use(promise);
  if (!data) return <div className="container py-24 text-center text-gray-400">Home is unavailable right now</div>;
  return (
    <>
      {data.categories.length > 0 ? (
        <section className="container">
          <CategoriesGrid categories={data.categories} />
        </section>
      ) : null}

      {data.sections.map((section) => (
        <section key={section.id}>
          <HomeProductSection
            sectionId={section.id}
            title={section.title}
            products={section.products}
            initialCursor={section.nextCursor ?? null}
            seeMorePath={section.href.replace(/^\/collections\//, "/shop?collection=")}
            seeMoreText="See All"
          />
        </section>
      ))}

    </>
  );
}

export default function HomePage({ data, sliders, storeName }: HomePageProps) {
  return (
    <div className="space-y-[var(--storefront-section-gap)]">
      <h1 className="sr-only">{storeName} — Modern online shopping in Bangladesh</h1>
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HomeHero data={data} sliders={sliders} />
      </Suspense>
      <Suspense fallback={<HomeCategoriesSkeleton />}>
        <HomeSections promise={data} />
      </Suspense>
    </div>
  );
}
