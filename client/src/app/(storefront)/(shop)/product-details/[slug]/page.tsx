import Features from "@/components/shared/Features";
import { fetchProduct } from "@/features/catalog/api";
import ProductDetails from "@/features/catalog/components/product/ProductDetails";
import ProductNotFound from "@/features/catalog/components/product/ProductNotFound";
import ProductTab from "@/features/catalog/components/product/ProductTab";
import RelatedProduct from "@/features/catalog/components/product/RelatedProduct";
import ProductsSkeleton from "@/features/catalog/skeleton/ProductsSkeleton";
import { PUBLIC_SITE_URL, SITE_NAME } from "@/config/site";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import { Metadata } from "next";
import { Suspense } from "react";

type Props = {
  params: Promise<{ slug: string }>;
};

function firstImageUrl(product: {
  images?: Array<{ imageUrl: string; isPrimary?: boolean }>;
}): string | undefined {
  const primary = product.images?.find((img) => img.isPrimary)?.imageUrl;
  if (primary) return primary;
  return product.images?.[0]?.imageUrl;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    fetchProduct(slug),
    fetchPublicSettingsOrDefault(),
  ]);
  const siteName = settings.store.name || SITE_NAME;

  if (!product) {
    return {
      title: `Product Not Found | ${siteName}`,
      description: "The requested product could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const productUrl = PUBLIC_SITE_URL
    ? new URL(`/product-details/${slug}`, PUBLIC_SITE_URL).toString()
    : undefined;
  const sourceImageUrl = firstImageUrl(product);
  const imageUrl =
    sourceImageUrl && (PUBLIC_SITE_URL || /^https?:\/\//i.test(sourceImageUrl))
      ? new URL(sourceImageUrl, PUBLIC_SITE_URL || undefined).toString()
      : undefined;
  const cleanDescription =
    (product.description || "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().slice(0, 160) ||
    `Discover premium quality products at ${siteName}.`;

  return {
    title: `${product.name} | ${siteName}`,
    description: cleanDescription,
    ...(productUrl ? { alternates: { canonical: productUrl } } : {}),
    openGraph: {
      title: product.name,
      description: cleanDescription,
      ...(productUrl ? { url: productUrl } : {}),
      siteName,
      ...(imageUrl
        ? { images: [{ url: imageUrl, width: 800, height: 600, alt: product.name }] }
        : {}),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: cleanDescription,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) return <ProductNotFound />;

  const settings = await fetchPublicSettingsOrDefault();
  const description = (product.description || "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  const images = (product.images ?? [])
    .map((image) => image.imageUrl)
    .filter(Boolean)
    .map((image) => {
      if (PUBLIC_SITE_URL) return new URL(image, PUBLIC_SITE_URL).toString();
      return /^https?:\/\//i.test(image) ? image : undefined;
    })
    .filter((image): image is string => Boolean(image));
  const prices = product.variants
    .map((variant) => Number(variant.price))
    .filter((price) => Number.isFinite(price) && price >= 0);
  const currency = settings.store.currency || "BDT";
  const productUrl = PUBLIC_SITE_URL
    ? new URL(`/product-details/${slug}`, PUBLIC_SITE_URL).toString()
    : undefined;
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(description ? { description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand?.name
      ? { brand: { "@type": "Brand", name: product.brand.name } }
      : {}),
    ...(product.category?.name ? { category: product.category.name } : {}),
    ...(productUrl ? { url: productUrl } : {}),
    ...(prices.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: currency,
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: prices.length,
            ...(productUrl ? { url: productUrl } : {}),
            availability: product.variants.some((variant) => (variant.availableStock ?? 0) > 0)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
    ...(product.averageRating && product.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
  const breadcrumbStructuredData = productUrl && PUBLIC_SITE_URL
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: new URL("/", PUBLIC_SITE_URL).toString(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Shop",
            item: new URL("/shop", PUBLIC_SITE_URL).toString(),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: productUrl,
          },
        ],
      }
    : null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      {breadcrumbStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <ProductDetails product={product} />
      <ProductTab product={product} />
      <Suspense
        fallback={
          <div className="container">
            <div className="mt-6 p-4 sm:p-5 md:mt-8">
              <ProductsSkeleton />
            </div>
          </div>
        }
      >
        <RelatedProduct categorySlug={product.category?.slug} currentProductId={product.id} />
      </Suspense>
      <Features />
    </div>
  );
}
