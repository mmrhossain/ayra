import { cn } from "@/lib/utils";
import ProductCard from "@/features/catalog/components/product/ProductCard";
import type { ProductListItem } from "@/features/catalog/api";

export default function ProductGrid({
  items,
  className,
  eagerFirstImage = false,
}: {
  items: ProductListItem[];
  className?: string;
  eagerFirstImage?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-7 xl:grid-cols-4",
        className
      )}
    >
      {items.map((item, index) => (
        <ProductCard
          key={item.id}
          product={item}
          eagerImage={eagerFirstImage && index === 0}
        />
      ))}
    </div>
  );
}
