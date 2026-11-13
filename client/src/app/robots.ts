import { getPublicSiteUrl } from "@/config/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/backend-proxy/", "/admin", "/customer"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
