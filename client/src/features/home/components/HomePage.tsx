import { heroFrameClass } from "@/features/slider/components/hero-layout";
import CategoriesGrid from "@/features/catalog/components/category/CategoriesGrid";
import HomeProductSection from "@/features/catalog/components/product/HomeProductSection";
import SliderCarousel from "@/features/slider/components/SliderCarousel";
import type { HomePayload } from "../types";

export default function HomePage({
  data,
  storeName,
}: {
  data: HomePayload;
  storeName: string;
}) {
  return (
    <div className="space-y-[var(--storefront-section-gap)]">
      <h1 className="sr-only">{storeName} — Modern online shopping in Bangladesh</h1>
      <section>
        {data.sliders.length ? (
          <div className="w-full overflow-hidden">
            <SliderCarousel sliders={data.sliders} />
          </div>
        ) : (
          <div className={heroFrameClass + " relative flex w-full items-center justify-center overflow-hidden bg-gray-100 text-gray-400"}>
            No banners available
          </div>
        )}
      </section>

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
    </div>
  );
}
