import { notFound } from "next/navigation";
import BlogDetails from "@/features/content/components/blog/BlogDetails";
import { fetchPublicBlogBySlug } from "@/features/content/api";
import { ApiError } from "@/lib/api/store-front";
import { PUBLIC_SITE_URL, SITE_NAME } from "@/config/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function getBlogOrNotFound(slug: string) {
  try {
    return await fetchPublicBlogBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

function plainText(value: string): string {
  return value.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogOrNotFound(slug);
  const description =
    blog.metaDescription?.trim() ||
    blog.excerpt?.trim() ||
    plainText(blog.content).slice(0, 160);
  const canonical = PUBLIC_SITE_URL
    ? new URL(`/blogs/${slug}`, PUBLIC_SITE_URL).toString()
    : undefined;
  const imageUrl =
    blog.featuredImage && PUBLIC_SITE_URL
      ? new URL(blog.featuredImage, PUBLIC_SITE_URL).toString()
      : blog.featuredImage && /^https?:\/\//i.test(blog.featuredImage)
        ? blog.featuredImage
        : undefined;

  return {
    title: `${blog.metaTitle?.trim() || blog.title} | ${SITE_NAME}`,
    ...(description ? { description } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: blog.metaTitle?.trim() || blog.title,
      ...(description ? { description } : {}),
      ...(canonical ? { url: canonical } : {}),
      siteName: SITE_NAME,
      type: "article",
      ...(imageUrl ? { images: [{ url: imageUrl, alt: blog.title }] } : {}),
      ...(blog.publishedAt ? { publishedTime: blog.publishedAt } : {}),
    },
  };
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlogOrNotFound(slug);
  const canonical = PUBLIC_SITE_URL
    ? new URL(`/blogs/${slug}`, PUBLIC_SITE_URL).toString()
    : undefined;
  const imageUrl =
    blog.featuredImage && PUBLIC_SITE_URL
      ? new URL(blog.featuredImage, PUBLIC_SITE_URL).toString()
      : blog.featuredImage && /^https?:\/\//i.test(blog.featuredImage)
        ? blog.featuredImage
        : undefined;
  const description =
    blog.metaDescription?.trim() ||
    blog.excerpt?.trim() ||
    plainText(blog.content).slice(0, 160);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(blog.publishedAt ? { datePublished: blog.publishedAt } : {}),
    ...(blog.updatedAt || blog.publishedAt
      ? { dateModified: blog.updatedAt || blog.publishedAt }
      : {}),
    ...(blog.category?.name ? { articleSection: blog.category.name } : {}),
    ...(canonical ? { mainEntityOfPage: canonical } : {}),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      ...(PUBLIC_SITE_URL ? { url: PUBLIC_SITE_URL } : {}),
    },
  };
  const breadcrumbStructuredData = canonical && PUBLIC_SITE_URL
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
            name: "Blog",
            item: new URL("/blogs", PUBLIC_SITE_URL).toString(),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: blog.title,
            item: canonical,
          },
        ],
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
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
      <BlogDetails blog={blog} />
    </>
  );
}
