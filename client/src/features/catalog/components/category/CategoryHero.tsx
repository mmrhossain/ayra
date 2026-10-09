import Image from "next/image";
import { CategoryHeroProps } from "../../types";

export default function CategoryHero({ parent_category }: CategoryHeroProps) {
  const name = parent_category?.name;

  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden h-[60svh] min-h-[350px] sm:h-[calc(100dvh-var(--header-height,120px))] sm:min-h-[500px]">
      {/* <Image
        src={
          parent_category?.mobileImage ||
          parent_category?.image ||
          "https://placehold.jp/1080x1350.png"
        }
        alt={name || "Category banner"}
        width={1920}
        height={820}
        priority={true}
        loading="eager"
        className="w-full h-auto object-cover"
      /> */}

      <Image
        src={parent_category?.image || "https://placehold.jp/1920x1080.png"}
        alt={name || "Category banner"}
        width={1920}
        height={1080}
        priority={true}
        loading="eager"
        className="w-full h-auto object-cover"
      />

      <div className="absolute z-20 px-4 text-center sm:px-6">
        <p className="text-3xl font-extralight uppercase leading-none tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl">
          {name}
        </p>
      </div>
    </div>
  );
}
