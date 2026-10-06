import Features from "@/components/shared/Features";
import { LegalDocument } from "@/features/content/components/legal/LegalDocument";
import { fetchPublishedLegal } from "@/features/content/api";

export const dynamic = "force-dynamic";

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
