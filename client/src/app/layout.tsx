import { AppSplash } from "@/components/shared/AppSplash";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import ScrollToTopOnNavigation from "@/components/shared/ScrollToTopOnNavigation";
import { Toaster } from "@/components/ui/sonner";
import { SITE_NAME, SITE_URL } from "@/config/site";
import ThemeColorManager from "@/hooks/ThemeColorManager";
import "@smastrom/react-rating/style.css";
import type { Metadata } from "next";
import { Jost } from "next/font/google";
import React, { Suspense } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Modern Online Shopping in Bangladesh`,
  description: "Bangladesh's premier modern e-commerce platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jost.variable} suppressHydrationWarning>
      <body className={`${jost.className} antialiased`} suppressHydrationWarning>
        <ThemeColorManager />
        <AppSplash />
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
