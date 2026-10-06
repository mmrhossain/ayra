"use client";

import BottomFooter from "@/components/layout/BottomFooter";
import TopFooter from "@/components/layout/TopFooter";

const Footer = () => {
  return (
    <footer className="mt-14 w-full bg-white text-secondary">
      <div className="container flex flex-col">
        <TopFooter />
      </div>
      <BottomFooter />
      <div className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:hidden" />
    </footer>
  );
};

export default Footer;
