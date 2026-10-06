import CustomButton from "@/components/shared/CustomButton";
import FancyHeading from "@/components/shared/FancyHeading";
import ProductCard from "@/features/catalog/components/product/ProductCard";
import { ArrowRight } from "lucide-react";
import { ProductListItem } from "../../types";

export default function HomeProductSection({
  title,
  products,
  seeMorePath,
  seeMoreText,
}: {
  title: string;
  products: ProductListItem[];
  seeMorePath: string;
  seeMoreText: string;
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="container my-12 md:my-16">
      {/* Top Header: Title on Left, See All Button on Right */}
      <div className="flex flex-row items-center justify-between mb-6 md:mb-8">
        <FancyHeading text={title} />

        {seeMorePath && seeMoreText && (
          <CustomButton
            ctaText={seeMoreText}
            path={seeMorePath}
            icon={
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            }
            className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-900 hover:text-primary bg-transparent hover:bg-transparent shadow-none p-0 h-auto gap-1"
          />
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  );
}
