import { fetchProducts } from "@/features/catalog/api";
import { Tag } from "lucide-react";
import Link from "next/link";
import ProductGrid from "./ProductGrid";

const RelatedProduct = async ({
  categorySlug,
  currentProductId,
}: {
  categorySlug?: string;
  currentProductId?: string;
}) => {
  if (!categorySlug) return null;

  let result;
  try {
    result = await fetchProducts({
      page: 1,
      limit: 12,
      category: categorySlug,
      sort: "newest",
    });
  } catch {
    return null;
  }

  const items = (result?.items ?? []).filter((p) => p.id !== currentProductId).slice(0, 8);

  if (items.length === 0) return null;

  return (
    <div className="container">
      <div className="mt-6 md:mt-8">
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-white p-1 rounded-md">
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
        <ProductGrid items={items} />
      </div>
    </div>
  );
};

export default RelatedProduct;
