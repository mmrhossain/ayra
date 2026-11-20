import { ScrollToTop } from "@/components/shared/ScrollToTop";
import ScrollToTopOnNavigation from "@/components/shared/ScrollToTopOnNavigation";
import { Toaster } from "@/components/ui/sonner";
import { PUBLIC_SITE_URL, SITE_NAME } from "@/config/site";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import ThemeColorManager from "@/hooks/ThemeColorManager";
import "@smastrom/react-rating/style.css";
import type { Metadata } from "next";
import { Jost } from "next/font/google";
import React, { Suspense } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchPublicSettingsOrDefault();
  const storeName = settings.store.name || SITE_NAME;
  const description = `Discover quality products and shop online with ${storeName}.`;
  const logoUrl =
    settings.store.ogImageUrl || settings.store.logoUrl || "/images/logo/logo.png";
  const socialImage =
    PUBLIC_SITE_URL || /^https?:\/\//i.test(logoUrl)
      ? new URL(logoUrl, PUBLIC_SITE_URL).toString()
      : undefined;

  return {
    ...(PUBLIC_SITE_URL ? { metadataBase: new URL(PUBLIC_SITE_URL) } : {}),
    applicationName: storeName,
    title: `${storeName} | Online Shopping in Bangladesh`,
    description,
    keywords: [
      storeName,
      "online shopping Bangladesh",
      "shop online Bangladesh",
      "quality products",
    ],
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${storeName} | Online Shopping in Bangladesh`,
      description,
      siteName: storeName,
      locale: "en_BD",
      type: "website",
      ...(socialImage ? { images: [{ url: socialImage, alt: `${storeName} logo` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} | Online Shopping in Bangladesh`,
      description,
      ...(socialImage ? { images: [socialImage] } : {}),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jost.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body className={`${jost.className} antialiased`} suppressHydrationWarning>
        <ThemeColorManager />
        <Suspense fallback={null}>
          <ScrollToTopOnNavigation />
        </Suspense>
        <ScrollToTop />

        {children}

        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
