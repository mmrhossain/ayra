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
    <div className="space-y-5">
      <h1 className="sr-only">{storeName} — Modern online shopping in Bangladesh</h1>
      <section>
        {data.sliders.length ? (
          <div className="w-full overflow-hidden">
            <SliderCarousel sliders={data.sliders} />
          </div>
        ) : (
          <div className="flex relative h-[60svh] min-h-[350px] w-full overflow-hidden sm:h-[calc(100dvh-var(--header-height,120px))] sm:min-h-[500px] items-center justify-center bg-gray-100 text-gray-400">
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
            seeMorePath={section.href}
            seeMoreText="See All"
          />
        </section>
      ))}
    </div>
  );
}
