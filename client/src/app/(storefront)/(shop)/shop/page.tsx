import ShopPage from "./[...slug]/page";
import type { Metadata } from "next";
import { PUBLIC_SITE_URL, SITE_NAME } from "@/config/site";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const INDEXING_FILTERS = new Set([
  "page",
  "category",
  "sort",
  "minPrice",
  "maxPrice",
  "search",
  "attrs",
  "categories",
]);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const query = await searchParams;
  const hasFilters = Object.keys(query).some((key) => INDEXING_FILTERS.has(key));

  return {
    title: `Shop | ${SITE_NAME}`,
    description: `Explore products and shop online at ${SITE_NAME}.`,
    ...(PUBLIC_SITE_URL
      ? { alternates: { canonical: new URL("/shop", PUBLIC_SITE_URL).toString() } }
      : {}),
    ...(hasFilters ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function RootShopPage({ searchParams }: { searchParams: SearchParams }) {
  return <ShopPage params={Promise.resolve({ slug: [] })} searchParams={searchParams} />;
}
