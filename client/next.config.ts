import type { NextConfig } from "next";

const backendOrigin =
  process.env.BACKEND_ORIGIN?.trim().replace(/\/+$/, "") || "http://localhost:5000";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

const imageHosts = [
  "placehold.net",
  "lh3.googleusercontent.com",
  "placehold.jp",
  "res.cloudinary.com",
];

if (siteUrl) {
  imageHosts.push(new URL(siteUrl).hostname);
}

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },

  async rewrites() {
    return [
      {
        source: "/backend-proxy/:path*",
        destination: `${backendOrigin}/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
