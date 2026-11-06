import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN || "http://localhost:5000";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const siteHost = siteUrl ? new URL(siteUrl).hostname : undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.monkeycode-ai.live"],
  images: {
    remotePatterns: [
      ...(siteHost
        ? [
            {
              protocol: "https" as const,
              hostname: siteHost,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "placehold.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "placehold.jp",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
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
