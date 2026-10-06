"use client";

import StoreImage from "@/components/shared/store-image";
import { Card } from "@/components/ui/card";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { CategoryListItem } from "../../types";

function categoryImage(src?: string | null): string {
  if (src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"))) {
    return src;
  }
  return "https://placehold.jp/400x400.png";
}

const CategoryCard = ({ category }: { category: CategoryListItem }) => {
  const shouldReduceMotion = useReducedMotion();

  // Handle root categories (parentSlug is null) vs subcategories
  const targetHref = category?.parentSlug
    ? `/shop/${category.parentSlug}/${category.slug}`
    : `/shop/${category.slug}`;

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : "hover"}
      initial="initial"
      className="group relative w-full"
    >
      <Link href={targetHref} className="block w-full">
        <Card className="w-full flex flex-col gap-0 rounded-none border-0 shadow-md p-0 bg-transparent overflow-hidden">
          <div className="relative overflow-hidden bg-stone-100">
            <motion.div
              variants={{
                initial: { scale: 1 },
                hover: { scale: 1.08 },
              }}
              transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
              className="aspect-square"
            >
              <StoreImage
                src={categoryImage(category.image)}
                alt={category?.name ?? "Category image"}
                fill
                className="object-cover w-auto h-auto"
              />
            </motion.div>

            <div className="absolute inset-x-0 bottom-0 flex h-12 translate-y-0 items-center justify-center overflow-hidden bg-white/80 backdrop-blur-sm transition-transform duration-500 md:translate-y-full md:group-hover:translate-y-0">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-900">
                Explore
              </span>
            </div>
          </div>

          <div className="pt-4 pb-2 text-center space-y-1">
            <h3 className="text-sm md:text-base font-black uppercase tracking-widest text-slate-800 transition-colors duration-300 group-hover:text-primary">
              {category?.name}
            </h3>
            <div className="flex justify-center">
              <motion.div
                variants={{
                  initial: { width: 0, opacity: 0 },
                  hover: { width: 24, opacity: 1 },
                }}
                className="h-[1.5px] bg-primary"
              />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
