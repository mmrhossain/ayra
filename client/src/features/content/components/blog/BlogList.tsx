"use client";

import FancyHeading from "@/components/shared/FancyHeading";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import BlogCard from "@/features/content/components/blog/BlogCard";
import type { PublicBlogListItem } from "@/features/content/types";
import { usePathname } from "next/navigation";
import React from "react";

type Props = {
  posts: PublicBlogListItem[];
};

const BlogList: React.FC<Props> = ({ posts }) => {
  const pathname = usePathname();

  if (posts.length === 0) {
    return (
      <div className="container mt-8">
        <FancyHeading text="Recent Blogs" />
        <p className="mt-12 text-sm text-muted-foreground">
          No published posts yet.
        </p>
      </div>
    );
  }

  const renderGrid = () => (
    <div className="container mt-8">
      <FancyHeading text="Recent Blogs" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 mt-12">
        {posts.map((blog) => (
          <BlogCard key={blog.id} blogItem={blog} />
        ))}
      </div>
    </div>
  );

  const renderCarousel = () => (
    <div className="container mt-8 overflow-x-hidden relative">
      <FancyHeading text="Recent Blogs" />

      <div className="relative mt-12">
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent className="flex gap-4">
            {posts.map((blog) => (
              <CarouselItem
                key={blog.id}
                className="basis-1/2 md:basis-1/3 xl:basis-1/4 group"
              >
                <BlogCard blogItem={blog} />
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious
            aria-label="Previous blog"
            className="border-0 hover:flex z-0 bg-primary text-white left-0 hover:bg-black transition-all duration-300"
          />
          <CarouselNext
            aria-label="Next blog"
            className="border-0 hover:flex z-0 bg-primary text-white right-0 hover:bg-black transition-all duration-300"
          />
        </Carousel>
      </div>
    </div>
  );

  return pathname === "/blogs" ? renderGrid() : renderCarousel();
};

export default BlogList;
