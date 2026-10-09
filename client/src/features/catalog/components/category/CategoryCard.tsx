"use client";

import { Card } from "@/components/ui/card";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
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
        <Card className="flex w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-md">
          {/* Image */}
          <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
            <motion.div
              variants={{
                initial: { scale: 1 },
                hover: { scale: 1.08 },
              }}
              transition={{
                duration: 0.6,
                ease: [0.33, 1, 0.68, 1],
              }}
              className="relative h-full w-full"
            >
              <Image
                src={categoryImage(category.image)}
                alt={category?.name ?? "Category image"}
                width={1920}
                height={1080}
                className="w-full h-auto"
              />
            </motion.div>

            {/* Explore Overlay */}
            <div className="absolute inset-x-0 bottom-0 hidden h-12 items-center justify-center overflow-hidden bg-white/80 backdrop-blur-sm transition-transform duration-500 md:flex md:translate-y-full md:group-hover:translate-y-0">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
                Explore
              </span>
            </div>
          </div>

          {/* Category Name */}
          <div className="space-y-1 pb-2 pt-4 text-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 transition-colors duration-300 group-hover:text-primary md:text-base">
              {category?.name}
            </h3>

            <div className="flex justify-center">
              <motion.div
                variants={{
                  initial: {
                    width: 0,
                    opacity: 0,
                  },
                  hover: {
                    width: 24,
                    opacity: 1,
                  },
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
