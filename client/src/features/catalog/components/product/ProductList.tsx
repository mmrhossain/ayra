"use client";

import ProductCard from "@/features/catalog/components/product/ProductCard";
import type { ProductListItem } from "@/features/catalog/types";

// import {
//     Carousel,
//     CarouselContent,
//     CarouselItem,
//     CarouselNext,
//     CarouselPrevious,
// } from "@/components/ui/carousel";

const ProductList = ({ products }: { products: ProductListItem[] }) => {
  // const pathname = usePathname();

  const renderGrid = () => (
    <div className="mt-6 md:mt-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 mt-4 md:mt-5 gap-3 sm:gap-5 lg:gap-7">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );

  // const renderCarousel = () => (
  //     <div className="container mt-0 overflow-x-hidden relative px-14">
  //         <div className="relative">
  //             <Carousel opts={{ align: "start", loop: true }} className="w-full">
  //                 <CarouselContent className="flex gap-0 items-center">
  //                     {products.map((product) => (
  //                         <CarouselItem
  //                             key={product.id}
  //                             className="w-full md:basis-1/3 lg:basis-1/4"
  //                         >
  //                             <ProductCard product={product} />
  //                         </CarouselItem>
  //                     ))}
  //                 </CarouselContent>
  //
  //                 <CarouselPrevious
  //                     aria-label="Previous product"
  //                     className="text-white border-0 absolute bg-primary hover:bg-btn-hover"
  //
  //                 />
  //                 <CarouselNext
  //                     aria-label="Next product"
  //                     className="text-white border-0 absolute bg-primary hover:bg-btn-hover"
  //                 />
  //             </Carousel>
  //         </div>
  //     </div>
  // );

  // return pathname === "/" ? renderCarousel() : renderGrid();

  return renderGrid();
};

export default ProductList;
