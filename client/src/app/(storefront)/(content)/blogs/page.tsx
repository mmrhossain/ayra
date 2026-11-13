import Features from "@/components/shared/Features";
import BlogList from "@/features/content/components/blog/BlogList";
import { fetchPublicBlogs } from "@/features/content/api";
import type { PublicBlogListItem } from "@/features/content/types";
import { PUBLIC_SITE_URL } from "@/config/site";

export const metadata = {
  title: "Blog",
  description: "Read news, helpful guides, and updates from our store.",
  ...(PUBLIC_SITE_URL
    ? { alternates: { canonical: new URL("/blogs", PUBLIC_SITE_URL).toString() } }
    : {}),
};

export const dynamic = "force-dynamic";

const Page = async () => {
  let posts: PublicBlogListItem[] = [];
  try {
    const result = await fetchPublicBlogs({ page: 1, limit: 20 });
    posts = result.items;
  } catch {
    posts = [];
  }

  return (
    <>
      <BlogList posts={posts} />
      <Features />
    </>
  );
};

export default Page;
