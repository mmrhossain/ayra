import type { ProductListItem } from "@/features/catalog/api";
import { productGridClass } from "./product-card.styles";
import ProductCard from "@/features/catalog/components/product/ProductCard";
import { cn } from "@/lib/utils";

// Prioritize the first desktop row; native lazy loading handles other visible rows.
const EAGER_SHOP_IMAGE_COUNT = 4;

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
        productGridClass,
        className
      )}
    >
      {items.map((item, index) => (
        <ProductCard key={item.id} product={item} eagerImage={eagerAboveFold && index < EAGER_SHOP_IMAGE_COUNT} />
      ))}
    </div>
  );
}
