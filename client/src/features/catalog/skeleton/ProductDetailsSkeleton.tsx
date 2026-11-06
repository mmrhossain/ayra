import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ProductDetailsSkeleton = () => {
  return (
    <div className="container mx-auto mt-4 min-w-0 max-w-6xl sm:mt-6 md:mt-8 xl:max-w-7xl">
      <div className="mb-5 hidden sm:block md:mb-8">
        <Skeleton width={280} height={16} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 md:gap-10 lg:gap-12 xl:gap-16 2xl:gap-20">
        <div className="min-w-0">
          <div className="flex w-full min-w-0 flex-col-reverse gap-3 lg:flex-row lg:items-start lg:gap-4">
            <div className="flex max-w-full gap-2.5 overflow-hidden py-1 sm:gap-3 lg:w-[72px] xl:w-[80px] lg:flex-col shrink-0">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square w-16 shrink-0 lg:w-full"
                >
                  <Skeleton height="100%" borderRadius={8} />
                </div>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <div className="aspect-square max-h-[480px] w-full">
                <Skeleton height="100%" borderRadius={8} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <Skeleton height={40} width="80%" />

          <div className="mt-3 flex items-center gap-2">
            <Skeleton width={90} height={18} />
            <Skeleton width={50} height={18} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Skeleton width={120} height={32} />
            <Skeleton width={100} height={28} />
            <Skeleton width={60} height={28} borderRadius={999} />
          </div>

          <div className="mt-6 border-t pt-5">
            <Skeleton width={120} height={16} />
            <div className="mt-3 flex gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} circle width={32} height={32} />
              ))}
            </div>
          </div>

          <div className="mt-6 border-t pt-5">
            <Skeleton width={110} height={16} />
            <div className="mt-3 flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} width={75} height={36} borderRadius={999} />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t pt-5">
            <Skeleton width={120} height={44} />
            <div className="flex-1">
              <Skeleton height={44} />
            </div>
          </div>

          <div className="mt-3">
            <Skeleton width={150} height={18} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsSkeleton;
