import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function SubcategoriesSkeleton() {
  return (
    <div className="w-full">
      {/* Category Hero Banner Skeleton */}
      <div
        className="
          relative 
          w-full 
          h-[50svh] 
          min-h-[300px] 
          overflow-hidden 
          flex 
          justify-center 
          items-center 
          bg-stone-100
          sm:h-[calc(100dvh-var(--header-height,120px))]
          sm:min-h-[450px]
        "
      >
        <div className="absolute inset-0">
          <Skeleton height="100%" className="w-full" />
        </div>
        {/* Title Skeleton */}
        <div className="relative z-20 text-center px-4 sm:px-6">
          <Skeleton width={200} height={40} className="sm:w-[350px] sm:h-[60px]" />
        </div>
      </div>

      {/* Subcategories Grid Skeleton matching CategoryCard layout */}
      <section className="container mt-6 md:mt-10 mb-12">
        <div className="grid grid-cols-2 gap-5 antialiased sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col w-full">
              <div className="relative w-full aspect-square bg-stone-100 overflow-hidden">
                <Skeleton height="100%" className="w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
