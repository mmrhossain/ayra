import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  productCardBody,
  productCardMedia,
  productGridClass,
} from "@/features/catalog/components/product/product-card.styles";

const ProductsSkeleton = ({ contained = true, className }: {
  contained?: boolean;
  className?: string;
}) => (
  <div role="status" aria-label="Loading products"
    className={cn(productGridClass, contained && "mt-8", className)}>
    {Array.from({ length: 8 }, (_, index) => (
      <div key={index} className="group relative" aria-hidden="true">
        <div className={productCardMedia}>
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        </div>
        <div className={productCardBody}>
          <Skeleton className="h-[1.375em] w-4/5 text-sm md:text-base" />
          <Skeleton className="h-6 w-2/5 md:h-7" />
        </div>
      </div>
    ))}
  </div>
);
export default ProductsSkeleton;
