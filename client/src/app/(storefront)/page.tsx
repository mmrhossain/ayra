import { fetchActiveSliders } from "@/features/slider/api";
import { unstable_rethrow } from "next/navigation";
import { fetchHome } from "@/features/home/api";
import HomePage from "@/features/home/components/HomePage";
import HomePageSkeleton from "@/features/home/skeleton/HomePageSkeleton";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import { PUBLIC_SITE_URL, SITE_NAME, SOCIAL_LINKS } from "@/config/site";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchPublicSettingsOrDefault();
  const storeName = settings.store.name || SITE_NAME;

  return {
    title: `${storeName} | Online Shopping in Bangladesh`,
    description: `Shop quality products online at ${storeName}. Explore the latest collection and enjoy a convenient shopping experience.`,
    ...(PUBLIC_SITE_URL
      ? { alternates: { canonical: new URL("/", PUBLIC_SITE_URL).toString() } }
      : {}),
  };
}

async function HomeContent() {
  const data = fetchHome().catch(error => {
    unstable_rethrow(error);
    return null;
  });
  const sliders = fetchActiveSliders().catch(error => {
    unstable_rethrow(error);
    return null;
  });
  const settings = await fetchPublicSettingsOrDefault();

  const storeName = settings.store.name || SITE_NAME;
  const organization = PUBLIC_SITE_URL
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: storeName,
        url: PUBLIC_SITE_URL,
        logo: new URL(
          settings.store.logoUrl || "/images/logo/logo.png",
          PUBLIC_SITE_URL,
        ).toString(),
        ...(settings.store.supportEmail || settings.store.supportPhone
          ? {
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                ...(settings.store.supportEmail
                  ? { email: settings.store.supportEmail }
                  : {}),
                ...(settings.store.supportPhone
                  ? { telephone: settings.store.supportPhone }
                  : {}),
              },
            }
          : {}),
        ...(SOCIAL_LINKS.length
          ? { sameAs: SOCIAL_LINKS.map((link) => link.href) }
          : {}),
      }
    : null;

  return (
    <>
      {organization ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organization).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <HomePage data={data} sliders={sliders} storeName={storeName} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
