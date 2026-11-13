import Features from "@/components/shared/Features";
import { LegalDocument } from "@/features/content/components/legal/LegalDocument";
import { fetchPublishedLegal } from "@/features/content/api";
import { PUBLIC_SITE_URL } from "@/config/site";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Terms of Service",
  description: "Review the terms and conditions for using our website and services.",
  ...(PUBLIC_SITE_URL
    ? { alternates: { canonical: new URL("/terms", PUBLIC_SITE_URL).toString() } }
    : {}),
};

const Page = async () => {
  let document = null;
  try {
    document = await fetchPublishedLegal("TERMS");
  } catch {
    document = null;
  }

  return (
    <>
      <LegalDocument
        document={document}
        fallbackTitle="Terms of Service"
        fallbackIntro="Please read these terms carefully before using our website and services."
      />
      <Features />
    </>
  );
};

export default Page;
