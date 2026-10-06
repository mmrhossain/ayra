import { fetchProducts } from "@/features/catalog/api";
import { Tag } from "lucide-react";
import Link from "next/link";
import ProductCard from "./ProductCard";

const RelatedProduct = async ({
  categorySlug,
  currentProductId,
}: {
  categorySlug?: string;
  currentProductId?: string;
}) => {
  if (!categorySlug) return null;

  const result = await fetchProducts({
    page: 1,
    limit: 12,
    category: categorySlug,
    sort: "newest",
  });

  const items = (result?.items ?? []).filter((p) => p.id !== currentProductId).slice(0, 8);

  if (items.length === 0) return null;

  return (
    <div className="container">
      <div className="bg-bg-primary rounded-md p-4 sm:p-5 mt-6 md:mt-8">
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-white p-2 rounded-md">
              <Tag size={20} className="text-primary" />
            </span>
            <h2 className="text-sm sm:text-lg md:text-2xl font-bold capitalize text-primary">
              Related Products
            </h2>
          </div>
          <Link
            href={`/shop?category=${encodeURIComponent(categorySlug)}`}
            className="text-primary underline text-sm font-semibold"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
          {items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelatedProduct;
