import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ProductSkeleton = () => {
  return (
    <div className="container mx-auto mt-4 min-w-0 max-w-6xl sm:mt-6 md:mt-8 xl:max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-5 hidden sm:block md:mb-8">
        <Skeleton width={280} height={16} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 md:gap-10 lg:gap-12 xl:gap-16 2xl:gap-20">
        {/* Gallery */}
        <div className="min-w-0">
          {/* Mobile */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square">
                <Skeleton height="100%" borderRadius={16} />
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:flex md:flex-col-reverse md:gap-3.5 lg:flex-row">
            <div className="flex gap-3 overflow-hidden lg:w-[90px] lg:flex-col">
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[100px] w-[90px]"
                  borderRadius={16}
                />
              ))}
            </div>

            <div className="min-w-0 flex-1">
              <div className="aspect-square w-full">
                <Skeleton height="100%" borderRadius={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex min-w-0 flex-col">
          {/* Title */}
          <Skeleton height={40} width="80%" />

          {/* Rating */}
          <div className="mt-3 flex items-center gap-2">
            <Skeleton width={90} height={18} />
            <Skeleton width={50} height={18} />
          </div>

          {/* Price */}
          <div className="mt-4 flex items-center gap-3">
            <Skeleton width={120} height={32} />
            <Skeleton width={100} height={28} />
            <Skeleton width={60} height={28} borderRadius={999} />
          </div>

          {/* Color Section */}
          <div className="mt-6 border-t pt-5">
            <Skeleton width={120} height={16} />
            <div className="mt-3 flex gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} circle width={32} height={32} />
              ))}
            </div>
          </div>

          {/* Size Section */}
          <div className="mt-6 border-t pt-5">
            <Skeleton width={110} height={16} />
            <div className="mt-3 flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} width={75} height={36} borderRadius={999} />
              ))}
            </div>
          </div>

          {/* Quantity + Add Cart */}
          <div className="mt-6 flex items-center gap-3 border-t pt-5">
            <Skeleton width={120} height={44} />
            <div className="flex-1">
              <Skeleton height={44} />
            </div>
          </div>

          {/* Wishlist */}
          <div className="mt-3">
            <Skeleton width={150} height={18} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
