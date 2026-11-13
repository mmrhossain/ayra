import Features from "@/components/shared/Features";
import { LegalDocument } from "@/features/content/components/legal/LegalDocument";
import { fetchPublishedLegal } from "@/features/content/api";
import { PUBLIC_SITE_URL } from "@/config/site";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Privacy Policy",
  description: "Read how we collect, use, and protect your personal information.",
  ...(PUBLIC_SITE_URL
    ? { alternates: { canonical: new URL("/privacy-policy", PUBLIC_SITE_URL).toString() } }
    : {}),
};

const Page = async () => {
  let document = null;
  try {
    document = await fetchPublishedLegal("PRIVACY");
  } catch {
    document = null;
  }

  return (
    <>
      <LegalDocument
        document={document}
        fallbackTitle="Privacy Policy"
        fallbackIntro="Your privacy is important to us. This policy outlines how we collect, use, and protect your personal data when you use our services."
      />
      <Features />
    </>
  );
};

export default Page;
