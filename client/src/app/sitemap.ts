import { getPublicSiteUrl } from "@/config/site";
import { fetchProducts, flattenCategories, getCategories } from "@/features/catalog/api";
import { categoryShopHref } from "@/features/catalog/utils/category-href";
import { fetchPublicBlogs } from "@/features/content/api";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;
const MAX_SITEMAP_URLS = 50_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();
  const urls: MetadataRoute.Sitemap = [];

  const addUrl = (path: string) => {
    if (urls.length >= MAX_SITEMAP_URLS) {
      throw new Error(
        `The sitemap exceeds ${MAX_SITEMAP_URLS} URLs. Split sitemap generation into multiple sitemaps.`,
      );
    }
    urls.push({ url: new URL(path, siteUrl).toString() });
  };

  [
    "/",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/blogs",
    "/privacy-policy",
    "/terms",
    "/vision",
  ].forEach(addUrl);

  const categories = flattenCategories(
    await getCategories({ next: { revalidate: 3600 } }),
  );
  categories.filter((category) => category.isActive).forEach((category) => {
    addUrl(categoryShopHref(category));
  });

  let page = 1;
  let productPages = 1;
  while (page <= productPages) {
    const result = await fetchProducts({ page, limit: PAGE_SIZE });
    productPages = Math.max(1, result.pagination.totalPages);
    result.items
      .filter((product) => product.status === "ACTIVE")
      .forEach((product) => addUrl(`/product-details/${encodeURIComponent(product.slug)}`));
    page += 1;
  }

  page = 1;
  let blogPages = 1;
  while (page <= blogPages) {
    const result = await fetchPublicBlogs({ page, limit: PAGE_SIZE });
    blogPages = Math.max(1, result.pagination.totalPages);
    result.items.forEach((blog) =>
      addUrl(`/blogs/${encodeURIComponent(blog.slug)}`),
    );
    page += 1;
  }

  return urls;
}
