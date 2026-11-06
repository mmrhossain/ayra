"use client";

import { Card } from "@/components/ui/card";
import { motion, useReducedMotion } from "framer-motion";
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
  const shouldReduceMotion = useReducedMotion();
  const targetHref = categoryShopHref(category);

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : "hover"}
      initial="initial"
      className="group relative w-full"
    >
      <Link href={targetHref} className="block w-full">
        <Card className="flex w-full flex-col gap-0 overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-md">
          {/* Image */}
          <div className="relative overflow-hidden">
            <motion.div
              variants={{
                initial: { scale: 1 },
                hover: { scale: 1.08 },
              }}
              transition={{
                duration: 0.6,
                ease: [0.33, 1, 0.68, 1],
              }}
              className="relative  aspect-square"
            >
              {/* card view */}
              <Image
                src={categoryImage(category?.mobileImage)}
                alt={category?.name ?? "Category image"}
                fill
                loading="eager"
                sizes="(max-width: 768px) 100vw, 800px"
                className="w-full h-auto object-cover aspect-square"
              />
            </motion.div>

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
