import { notFound } from "next/navigation";
import BlogDetails from "@/features/content/components/blog/BlogDetails";
import { fetchPublicBlogBySlug } from "@/features/content/api";

export const dynamic = "force-dynamic";

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let blog;
  try {
    blog = await fetchPublicBlogBySlug(slug);
  } catch {
    notFound();
  }

  if (!blog) notFound();

  return <BlogDetails blog={blog} />;
}
