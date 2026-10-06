import StoreImage from "@/components/shared/store-image";
import { CategoryHeroProps } from "../../types";

export default function CategoryHero({ parent_category }: CategoryHeroProps) {
  const name = parent_category?.name;

  return (
    <div
      className="
        relative 
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
      {/* Background Image Container with absolute positioning and scale effect */}
      <div className="transition-transform duration-1000 ease-out hover:scale-105">
        {/* Mobile Image */}
        <div className="relative overflow-hidden sm:hidden">
          <StoreImage
            src={
              parent_category?.mobileImage ||
              parent_category?.image ||
              "https://placehold.jp/1080x1350.png"
            }
            alt={name || "Category banner"}
            fill
            priority={true}
            loading="eager"
            className="w-auto h-auto object-cover"
          />
        </div>

        {/* Desktop Image */}
        <div className="hidden sm:block">
          <StoreImage
            src={parent_category?.image || "https://placehold.jp/1920x720.png"}
            alt={name || "Category banner"}
            priority={true}
            loading="eager"
            className="h-auto w-auto object-cover"
            fill
          />
        </div>
      </div>

      {/* Dark Overlay to make text readable over the background image */}
      {/* <div className="absolute inset-0 bg-black/5 z-10" /> */}

      {/* Title */}
      <div className="absolute z-20 text-center px-4 sm:px-6">
        <p className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white uppercase tracking-tight font-extralight leading-none drop-shadow-md">
          {name}
        </p>
      </div>
    </div>
  );
}
