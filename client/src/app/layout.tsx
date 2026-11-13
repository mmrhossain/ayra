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
  return {
    ...(PUBLIC_SITE_URL ? { metadataBase: new URL(PUBLIC_SITE_URL) } : {}),
    title: `${settings.store.name || SITE_NAME} | Online Shopping in Bangladesh`,
    description: `Discover quality products and shop online with ${settings.store.name || SITE_NAME}.`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jost.variable} suppressHydrationWarning>
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
