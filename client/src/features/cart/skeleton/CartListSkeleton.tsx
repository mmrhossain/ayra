import Skeleton from "react-loading-skeleton";

const CartListSkeleton = () => {
  return (
    <section className="container storefront-page-start mx-auto min-w-0 max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem]">
      <div className="mb-3 sm:mb-4">
        <Skeleton height={16} width={140} />
      </div>
      <div className="mb-5 md:mb-6">
        <Skeleton height={36} width={220} />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.9fr)] lg:items-start xl:gap-6 2xl:gap-8">
        <div className="rounded-[20px] border border-border-color px-4 sm:px-5 md:px-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex min-w-0 items-start gap-2.5 border-b border-border-color py-4 last:border-0 sm:gap-4 sm:py-5"
            >
              <Skeleton
                className="h-16 w-16 shrink-0 xs:h-20 xs:w-20 sm:h-[110px] sm:w-[110px]"
                borderRadius={8}
              />
              <div className="flex min-w-0 flex-1 justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton width="70%" height={18} />
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="50%" height={14} />
                  <Skeleton width={80} height={20} />
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Skeleton circle width={28} height={28} />
                  <Skeleton width={96} height={36} borderRadius={999} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-fit rounded-[20px] border border-border-color p-5 md:p-6">
          <Skeleton width={160} height={24} />
          <div className="mt-5 space-y-4">
            <Skeleton height={18} />
            <Skeleton height={18} />
            <Skeleton height={18} />
            <Skeleton height={24} />
          </div>
          <div className="mt-5 flex gap-3">
            <Skeleton height={48} borderRadius={999} className="flex-1" />
            <Skeleton height={48} width={90} borderRadius={999} />
          </div>
          <div className="mt-5">
            <Skeleton height={54} borderRadius={999} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartListSkeleton;
