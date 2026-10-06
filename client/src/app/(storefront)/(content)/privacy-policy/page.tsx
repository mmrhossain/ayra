import Features from "@/components/shared/Features";
import { LegalDocument } from "@/features/content/components/legal/LegalDocument";
import { fetchPublishedLegal } from "@/features/content/api";

export const dynamic = "force-dynamic";

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
