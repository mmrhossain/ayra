import Faq from "@/features/content/components/faq/Faq";
import Features from "@/components/shared/Features";
import { fetchPublicFaqs, type PublicFaqCategory } from "@/features/content/api";
import { PUBLIC_SITE_URL } from "@/config/site";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about products, orders, delivery, and support.",
  ...(PUBLIC_SITE_URL
    ? { alternates: { canonical: new URL("/faq", PUBLIC_SITE_URL).toString() } }
    : {}),
};

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
