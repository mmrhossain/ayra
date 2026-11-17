import Skeleton from "react-loading-skeleton";
import { cn } from "@/lib/utils";

const ProductsSkeleton = ({
  contained = true,
  className,
}: {
  contained?: boolean;
  className?: string;
}) => {
  return (
    <div
      role="status"
      aria-label="Loading products"
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-7",
        contained && "mt-8 container mx-auto",
        className,
      )}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="group relative" key={index} aria-hidden="true">
          <div className="relative w-full aspect-[3/4]">
            <Skeleton height="100%" containerClassName="flex-1" />
          </div>

          <div className="space-y-3 mt-3">
            <Skeleton width="80%" height={20} />
            <Skeleton width="40%" height={18} />
            <Skeleton width="35%" height={15} />
            <Skeleton width="100%" height={40} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductsSkeleton;
