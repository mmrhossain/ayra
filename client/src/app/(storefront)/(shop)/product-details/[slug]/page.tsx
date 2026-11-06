import Features from "@/components/shared/Features";
import { fetchProduct } from "@/features/catalog/api";
import ProductDetails from "@/features/catalog/components/product/ProductDetails";
import ProductNotFound from "@/features/catalog/components/product/ProductNotFound";
import ProductTab from "@/features/catalog/components/product/ProductTab";
import RelatedProduct from "@/features/catalog/components/product/RelatedProduct";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

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
  const product = await fetchProduct(slug);

  if (!product) {
    return {
      title: `Product Not Found | ${SITE_NAME}`,
      description: "The requested product could not be found.",
    };
  }

  const siteUrl = SITE_URL;
  const productUrl = `${siteUrl}/product-details/${slug}`;
  const imageUrl =
    firstImageUrl(product) || `${siteUrl}/images/placeholder/product_placeholder.jpg`;
  const cleanDescription =
    (product.description || "").replace(/<[^>]*>?/gm, "").slice(0, 160) ||
    `Discover premium quality products at ${SITE_NAME}.`;

  return {
    title: `${product.name} | ${SITE_NAME}`,
    description: cleanDescription,
    alternates: { canonical: productUrl },
    openGraph: {
      title: product.name,
      description: cleanDescription,
      url: productUrl,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 800, height: 600, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: cleanDescription,
      images: imageUrl,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) return <ProductNotFound />;

  return (
    <div>
      <ProductDetails product={product} />
      <ProductTab product={product} />
      <RelatedProduct categorySlug={product.category?.slug} currentProductId={product.id} />
      <Features />
    </div>
  );
}
