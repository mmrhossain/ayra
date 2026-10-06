import Image from "next/image";
import { RichTextContent } from "@/components/shared/rich-text-content";
import type { PublicBlogPost } from "@/features/content/types";

const PLACEHOLDER = "/images/placeholder/placeholder.png";

const BlogDetails = ({ blog }: { blog: PublicBlogPost }) => {
  const dateLabel = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString()
    : null;
  const categoryName = blog.category?.name;

  return (
    <div className="bg-white pb-20 md:pb-24 mt-6 md:mt-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 md:gap-12">
          <div className="w-full lg:w-2/3">
            <header className="mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                {blog.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-gray-500 border-b pb-6">
                {dateLabel ? (
                  <p>
                    <span className="font-semibold text-slate-800 uppercase tracking-wider">
                      Date:
                    </span>{" "}
                    {dateLabel}
                  </p>
                ) : null}
                {categoryName ? (
                  <>
                    <span className="hidden md:inline text-gray-300">/</span>
                    <p>
                      <span className="font-semibold text-slate-800 uppercase tracking-wider">
                        In:
                      </span>
                      <span className="text-primary ml-1 font-medium">
                        {categoryName}
                      </span>
                    </p>
                  </>
                ) : null}
              </div>
            </header>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8 md:mb-12 shadow-sm">
              <Image
                src={blog.featuredImage || PLACEHOLDER}
                alt={blog.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {blog.excerpt ? (
              <p className="text-lg md:text-2xl font-medium text-slate-900 border-l-4 border-primary pl-4 md:pl-6 py-2 mb-8">
                {blog.excerpt}
              </p>
            ) : null}

            <RichTextContent
              html={blog.content}
              className="text-base leading-relaxed text-gray-700 md:text-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;
