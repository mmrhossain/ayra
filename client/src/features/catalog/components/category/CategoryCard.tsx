import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { CategoryListItem } from "../../types";
import { categoryShopHref } from "../../utils/category-href";

function categoryImage(src?: string | null): string {
  if (src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"))) {
    return src;
  }

  return "https://placehold.jp/400x400.png";
}

const CategoryCard = ({ category }: { category: CategoryListItem }) => {
  const targetHref = categoryShopHref(category);

  return (
    <div className="group relative w-full">
      <Link prefetch={false} href={targetHref} className="block w-full">
        <Card className="flex w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-md">
          {/* Image */}
          <div className="relative overflow-hidden">
            <div className="relative aspect-square transition-transform duration-[600ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-[1.08] motion-reduce:transform-none motion-reduce:transition-none">
              {/* card view */}
              <Image
                src={categoryImage(category?.mobileImage)}
                alt={category?.name ?? "Category image"}
                fill
                loading="lazy"
                sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                className="w-full h-auto object-cover aspect-square"
              />
            </div>

            {/* Explore Overlay */}
            <div className="absolute inset-x-0 bottom-0 hidden h-12 items-center justify-center overflow-hidden bg-white/80 backdrop-blur-sm transition-transform duration-500 md:flex md:translate-y-full md:group-hover:translate-y-0">
              <span className="text-xs font-semibold tracking-wide uppercase text-slate-900">
                Explore
              </span>
            </div>
          </div>

          {/* Category Name */}
          <div className="space-y-1 pb-2 pt-4 text-center">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-800 transition-colors duration-300 group-hover:text-primary md:text-base">
              {category?.name}
            </h3>

            <div className="flex justify-center">
              <div className="h-[1.5px] w-0 bg-primary opacity-0 transition-all group-hover:w-6 group-hover:opacity-100 motion-reduce:transition-none" />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
};

export default CategoryCard;
