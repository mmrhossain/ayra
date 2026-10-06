import Faq from "@/features/content/components/faq/Faq";
import Features from "@/components/shared/Features";
import { fetchPublicFaqs, type PublicFaqCategory } from "@/features/content/api";

export const dynamic = "force-dynamic";

const Page = async () => {
  let categories: PublicFaqCategory[] = [];
  try {
    categories = await fetchPublicFaqs();
  } catch {
    categories = [];
  }

  return (
    <div>
      <Faq categories={categories} />
      <Features />
    </div>
  );
};

export default Page;
