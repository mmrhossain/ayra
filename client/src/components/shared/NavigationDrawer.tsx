import React from 'react';
import { Category } from "@/types/category";
import { motion, useReducedMotion } from "framer-motion";
import {getAutoColumns, slugify, splitCategoryColumns} from "@/helpers";
import Link from "next/link";
import Image from "next/image";

interface NavigationDrawerProps {
    category: Category;
    handleMouseLeave: () => void;
    handleDrawerEnter: () => void;
}

const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
                                                               category,
                                                               handleMouseLeave,
                                                               handleDrawerEnter
                                                           }) => {
    const shouldReduceMotion = useReducedMotion();

    if (!category) return null;

    const autoCols = getAutoColumns(category.all_children.length);
    const columnData = splitCategoryColumns(category.all_children, autoCols);

    return (
        <motion.div
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleDrawerEnter}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            className="absolute top-full left-0 right-0 pb-6 shadow-xl w-full z-50 bg-white"
        >
            {/* Wrapper */}
            <div className="flex flex-col lg:flex-row gap-6 container">

                {/* LEFT: Category Columns */}
                <div className="w-full lg:w-4/5 grid md:grid-cols-4 gap-6">
                    {columnData?.map((col, index) => (
                        <ul
                            key={index}
                            className="border-r px-8 space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pr-2"
                        >
                            {col?.map((item) => (
                                <li
                                    key={item?.id}
                                    onClick={handleMouseLeave}
                                    className="text-gray-600 hover:text-black cursor-pointer space-y-1.5"
                                >
                                    {item?.all_children?.length > 0 ? (
                                        <>
                                            <Link
                                                href={`/${slugify(category?.slug)}/${slugify(item?.slug)}/${item?.id}`}
                                                className={`uppercase text-black text-[15px] transition-colors`}
                                            >
                                                {item?.name}
                                            </Link>

                                            {item?.all_children?.map((child: Category) => (
                                                <Link
                                                    key={child?.id}
                                                    href={`/${slugify(category?.slug)}/${slugify(item?.slug)}/${slugify(child?.slug)}/${child?.id}`}
                                                    onClick={handleMouseLeave}
                                                    className="block text-secondary"
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </>
                                    ) : (
                                        <Link
                                            href={`/${slugify(category?.slug)}/${slugify(item?.slug)}/${item?.id}`}
                                            onClick={handleMouseLeave}
                                            className="block py-1 uppercase text-black text-[15px]"
                                        >
                                            {item.name}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>

                {/* RIGHT: Category Image */}
                <div className="hidden lg:flex lg:w-1/5 items-center justify-center">
                    <Image
                        src={
                            category?.cat_image
                                ? `https://app.raangalay.com/${category.cat_image}`
                                : "/images/blog/blog1.png"
                        }
                        alt={category?.name}
                        width={250}
                        height={250}
                        className="object-cover"
                    />
                </div>

            </div>
        </motion.div>

    );
};

export default NavigationDrawer;
