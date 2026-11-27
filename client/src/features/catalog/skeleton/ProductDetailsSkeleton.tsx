import { Skeleton } from "@/components/ui/skeleton";
import { productDetailsLayout as layout } from "@/features/catalog/components/product/product-details-layout";
import { cn } from "@/lib/utils";

export default function ProductDetailsSkeleton() {
  return (
    <div className={layout.container} role="status" aria-label="Loading product details">
      <div aria-hidden="true">
        <div className={layout.breadcrumb}>
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>

        <div className={layout.grid}>
          <div className={layout.gallery}>
            <div className={cn(layout.thumbnailRail, "overflow-hidden")}>
              {[0, 1, 2, 3].map(index => (
                <Skeleton key={index} className="aspect-square w-16 shrink-0 rounded-md lg:w-full" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <Skeleton className={layout.galleryImage} />
            </div>
          </div>

          <div className={layout.details}>
            <Skeleton className="h-[30px] w-4/5 lg:h-[38px]" />

            <div className="mt-3 flex min-h-8 items-center gap-2 sm:mt-4 sm:min-h-9 sm:gap-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>

            <div className="mt-4 grid min-h-[3.25rem] grid-cols-2 gap-x-4 gap-y-2 sm:mt-5">
              {[0, 1, 2].map(index => (
                <div key={index} className="space-y-0.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-24 max-w-full" />
                </div>
              ))}
            </div>

            <div className={layout.controls}>
              {[0, 1, 2].map(index => (
                <div key={index} className={index === 0 ? layout.quantity : "min-w-0 lg:flex-1"}>
                  <div className="mb-2 flex h-5 items-center">
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-none sm:h-[52px]" />
                </div>
              ))}
            </div>

            <div className={layout.actions}>
              <Skeleton className="h-12 min-w-0 flex-1 rounded-none sm:h-[52px]" />
              <Skeleton className="size-12 shrink-0 rounded-none sm:size-[52px]" />
              <Skeleton className="size-12 shrink-0 rounded-none sm:size-[52px]" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[0, 1].map(index => (
                <div key={index} className="flex min-w-0 items-start gap-2 border border-border-color p-2.5">
                  <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-24 max-w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container storefront-section-start mx-auto max-w-6xl" aria-hidden="true">
        <div className="flex items-center border-b border-border-color">
          {[0, 1, 2].map(index => (
            <div key={index} className="flex flex-1 justify-center pb-3 sm:pb-4">
              <Skeleton className="h-5 w-24 max-w-[80%]" />
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3 md:mt-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full max-w-4xl" />
          <Skeleton className="h-4 w-5/6 max-w-4xl" />
          <Skeleton className="h-4 w-2/3 max-w-4xl" />
        </div>
      </div>
    </div>
  );
}
