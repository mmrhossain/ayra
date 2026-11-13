// import MasterLayout from "@/components/layout/MasterLayout";
import Features from "@/components/shared/Features";
import Contact from "@/features/content/components/contact/Contact";
import { PUBLIC_SITE_URL } from "@/config/site";

export const metadata = {
  title: "Contact Us",
  description: "Contact our team for help with products, orders, or your shopping experience.",
  ...(PUBLIC_SITE_URL
    ? { alternates: { canonical: new URL("/contact", PUBLIC_SITE_URL).toString() } }
    : {}),
};

const Page = () => {
  return (
    <>
      <Contact />
      <Features />
    </>
  );
};

export default Page;
