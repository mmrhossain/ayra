import type { ProductListItem } from "@/features/catalog/api";
import ProductCard from "@/features/catalog/components/product/ProductCard";
import { cn } from "@/lib/utils";

const EAGER_SHOP_IMAGE_COUNT = 8;

export default function ProductGrid({
  items,
  className,
  eagerAboveFold = false,
}: {
  items: ProductListItem[];
  className?: string;
  eagerAboveFold?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-7 xl:grid-cols-4",
        className
      )}
    >
      {items.map((item, index) => (
        <ProductCard key={item.id} product={item} eagerImage={eagerAboveFold && index < EAGER_SHOP_IMAGE_COUNT} />
      ))}
    </div>
  );
}
