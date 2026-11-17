import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ApiError } from "@/lib/api/store-front";
import { fetchCollectionProducts } from "@/features/catalog/collections";
import CollectionProductList from "@/features/catalog/components/shop/CollectionProductList";
import { SITE_NAME, PUBLIC_SITE_URL } from "@/config/site";
const loadCollection = cache(async (slug: string) => {
  try {
    return await fetchCollectionProducts(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});
type Props = {
  params: Promise<{
    slug: string;
  }>;
};
export async function generateMetadata({
  params
}: Props): Promise<Metadata> {
  const {
    slug
  } = await params;
  const {
    collection
  } = await loadCollection(slug);
  return {
    title: collection.name + " | " + SITE_NAME,
    description: collection.description || "Shop " + collection.name + " at " + SITE_NAME + ".",
    ...(PUBLIC_SITE_URL ? {
      alternates: {
        canonical: new URL("/collections/" + encodeURIComponent(collection.slug), PUBLIC_SITE_URL).toString()
      }
    } : {})
  };
}
export default async function CollectionPage({
  params
}: Props) {
  const {
    slug
  } = await params;
  const initial = await loadCollection(slug);
  return <main className="container py-8 md:py-12">
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground"><Link href="/shop" className="hover:underline">Shop</Link><span aria-hidden="true"> / </span><span>{initial.collection.name}</span></nav>
    <h1 className="text-2xl font-semibold md:text-3xl">{initial.collection.name}</h1>
    {initial.collection.description ? <p className="mt-3 max-w-3xl whitespace-pre-line text-muted-foreground">{initial.collection.description}</p> : null}
    <div className="mt-8"><CollectionProductList key={slug} initial={initial} /></div>
  </main>;
}
