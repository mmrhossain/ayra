import Image from "next/image";
import { CategoryHeroProps } from "../../types";

export default function CategoryHero({ parent_category }: CategoryHeroProps) {
  const name = parent_category?.name;

  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden h-[60svh] min-h-[350px] sm:h-[calc(100dvh-var(--header-height,120px))] sm:min-h-[500px]">
      {/* Mobile Image */}
      <Image
        src={
          parent_category?.mobileImage ||
          parent_category?.image ||
          "https://placehold.jp/800x800.png"
        }
        alt={name || "Category banner"}
        fill
        priority={true}
        sizes="(max-width: 768px) 100vw, 800px"
        className="object-cover md:hidden"
      />

      {/* Desktop Image */}
      <Image
        src={parent_category?.image || "https://placehold.jp/1920x820.png"}
        alt={name || "Category banner"}
        fill
        priority={true}
        className="object-cover hidden md:block"
        sizes="(max-width: 1920px) 100vw, 1920px"
      />

      {/* Text Overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 px-4 text-center sm:px-6">
        <p className="text-3xl font-extralight uppercase leading-none tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl">
          {name}
        </p>
      </div>
    </div>
  );
}
