"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export const ScrollToTop: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      disabled={!show}
      onClick={() => window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })}
      className={
        "fixed right-4 md:right-6 bottom-[calc(var(--bottom-nav-space)_+_var(--sticky-cart-space)_+_9rem)] lg:bottom-40 rounded-full h-11 w-11 bg-gray-800 text-white shadow-lg flex items-center justify-center z-[9998] hover:bg-gray-700 transition-all duration-[250ms] ease-in-out active:scale-95 motion-reduce:transition-none motion-reduce:transform-none " +
        (show ? "visible translate-y-0 opacity-100" : "invisible translate-y-[60px] opacity-0 pointer-events-none")
      }
    >
      <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
    </button>
  );
};
