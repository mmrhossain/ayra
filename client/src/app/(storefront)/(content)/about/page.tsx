import Features from "@/components/shared/Features";
import About from "@/features/content/components/about/About";
import { PUBLIC_SITE_URL } from "@/config/site";

export const metadata = {
  title: "About Us",
  description: "Learn about our store, our values, and the shopping experience we aim to provide.",
  ...(PUBLIC_SITE_URL
    ? { alternates: { canonical: new URL("/about", PUBLIC_SITE_URL).toString() } }
    : {}),
};

const Page = () => {
  return (
    <>
      <About />
      <Features />
    </>
  );
};

export default Page;
