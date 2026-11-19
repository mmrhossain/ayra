export const productDetailsLayout = {
  container: "container storefront-page-start z-0 mx-auto min-w-0 max-w-6xl xl:max-w-7xl",
  breadcrumb: "mb-4 hidden sm:flex md:mb-6",
  grid: "grid min-w-0 grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 md:gap-10 lg:gap-12 xl:gap-16 2xl:gap-20",
  details: "flex min-w-0 flex-col md:min-h-[480px]",
  controls: "mt-5 grid grid-cols-1 items-start gap-3 border-t border-border-color pt-4 sm:mt-6 sm:grid-cols-2 sm:gap-4 sm:pt-5 lg:flex lg:gap-4",
  quantity: "min-w-0 w-full sm:w-[160px] sm:shrink-0",
  actions: "mt-10 flex w-full min-w-0 items-stretch gap-2.5 sm:mt-11 sm:gap-3",
  gallery: "flex w-full min-w-0 flex-col-reverse gap-3 lg:flex-row lg:items-start lg:gap-4",
  thumbnailRail: "flex max-w-full shrink-0 gap-2.5 py-1 sm:gap-3 lg:max-h-[480px] lg:w-[72px] lg:flex-col xl:w-[80px]",
  galleryImage: "aspect-square max-h-[480px] w-full rounded-lg",
} as const;
