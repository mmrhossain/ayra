"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

const HIDDEN_ROUTES = ["/checkout", "/cart"];

export default function SocialContact() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Check if current path matches any hidden route or sub-route
  const isHiddenRoute = HIDDEN_ROUTES.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    if (isHiddenRoute) return;

    let observer: IntersectionObserver | null = null;

    // Postpone DOM query to ensure Hero element is mounted after client navigation
    const animationFrameId = requestAnimationFrame(() => {
      const hero = document.getElementById("hero");

      if (!hero) {
        setVisible(true);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          setVisible(!entry.isIntersecting);
        },
        { threshold: 0.25 }
      );

      observer.observe(hero);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer?.disconnect();
    };
  }, [pathname, isHiddenRoute]);

  if (isHiddenRoute) return null;

  return (
    <div
      className={`fixed right-4 md:right-6 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:bottom-6 z-[9999] group transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      {/* Subtle Pulse Ring */}
      <span className="absolute inset-0 rounded-full bg-green-500 opacity-40 animate-ping motion-reduce:animate-none" />

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/8801703581774?text=Hello%20I%20have%20a%20question"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white text-2xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <FaWhatsapp />
      </a>

      {/* Tooltip (Desktop only) */}
      <span className="hidden md:block absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-md">
        Chat with us
      </span>
    </div>
  );
}
