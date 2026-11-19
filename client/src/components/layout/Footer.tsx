import BottomFooter from "@/components/layout/BottomFooter";
import TopFooter from "@/components/layout/TopFooter";

const Footer = () => {
  return (
    <footer className="mt-[var(--storefront-section-gap)] w-full bg-white text-foreground">
      <div className="container flex flex-col">
        <TopFooter />
      </div>
      <BottomFooter />
      <div className="h-[calc(var(--bottom-nav-space)+var(--sticky-cart-space))] lg:hidden" />
    </footer>
  );
};

export default Footer;
