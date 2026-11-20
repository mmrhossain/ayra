import { getImageProps } from "next/image";
import { CategoryHeroProps } from "../../types";

export default function CategoryHero({ parent_category }: CategoryHeroProps) {
  const name = parent_category?.name;
  const mobile = getImageProps({
    src: parent_category?.mobileImage || parent_category?.image || "https://placehold.jp/800x800.png",
    alt: name || "Category banner",
    fill: true,
    sizes: "100vw",
    loading: "eager",
    fetchPriority: "high",
  }).props;
  const desktop = getImageProps({
    src: parent_category?.image || "https://placehold.jp/1920x820.png",
    alt: name || "Category banner",
    fill: true,
    sizes: "(max-width: 1920px) 100vw, 1920px",
  }).props;

  return (
    <div className="relative flex h-[52svh] min-h-[310px] w-full items-center justify-center overflow-hidden sm:h-[calc(100dvh-var(--header-height,120px)-128px)] sm:min-h-[370px]">
      <picture>
        <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />
        {/* Optimized responsive sources select just the matching banner. */}
        <img {...mobile} alt={mobile.alt} className="object-cover" />
      </picture>
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 px-4 text-center sm:px-6">
        <p className="text-3xl font-extralight uppercase leading-none tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl">
          {name}
        </p>
      </div>
    </div>
  );
}
