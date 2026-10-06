import { BlogDetails, BlogPost } from "@/types/blog";

export const blogList: BlogPost[] = [
  {
    id: 1,
    title: "Spring Style Guide",
    date: "March 12, 2026",
    image: "/images/placeholder/placeholder.png",
  },
  {
    id: 2,
    title: "Home Decor Trends",
    date: "April 02, 2026",
    image: "/images/placeholder/placeholder.png",
  },
  {
    id: 3,
    title: "Everyday Essentials",
    date: "May 18, 2026",
    image: "/images/placeholder/placeholder.png",
  },
];

export const blogDetailsList: BlogDetails[] = blogList.map((post) => ({
  ...post,
  author: "Raangalay Team",
  description: post.title,
  tags: ["fashion", "lifestyle"],
  categories: ["Journal"],
  socialLinks: [],
  relatedPosts: [],
  comments: [],
}));
