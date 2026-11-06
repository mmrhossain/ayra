import Skeleton from "react-loading-skeleton";

const WishListSkeleton = () => {
  return (
    <section className="min-w-0 pb-24 md:pb-0">
      <div className="mb-6 space-y-2">
        <Skeleton width={180} height={28} />
        <Skeleton width={140} height={16} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex min-w-0 flex-col">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton height={16} className="mt-3 mb-2" />
            <Skeleton height={14} width="50%" className="mb-3" />
            <Skeleton height={44} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default WishListSkeleton;
