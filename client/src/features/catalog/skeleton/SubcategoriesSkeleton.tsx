import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function SubcategoriesSkeleton() {
  return (
    <div className="w-full">
      <div
        className="
          relative 
          w-full 
          h-[60svh]
          min-h-[350px]
          overflow-hidden 
          flex 
          justify-center 
          items-center 
          bg-stone-100
          sm:h-[calc(100dvh-var(--header-height,120px))]
          sm:min-h-[500px]
        "
      >
        <div className="absolute inset-0">
          <Skeleton height="100%" className="w-full" />
        </div>
        <div className="relative z-20 text-center px-4 sm:px-6">
          <Skeleton width={200} height={40} className="sm:w-[350px] sm:h-[60px]" />
        </div>
      </div>

      <section className="container storefront-page-start space-y-4 md:space-y-6">
        <div className="h-7 w-52 rounded bg-muted sm:h-9 lg:h-10" aria-hidden="true" />
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
