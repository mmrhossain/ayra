"use client";

import { useEffect } from "react";

export default function HeaderHeightObserver() {
  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector("header");
      const navbar = document.querySelector("nav");

      const headerHeight = header ? header.offsetHeight : 0;
      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      const totalHeight = headerHeight + navbarHeight;

      document.documentElement.style.setProperty(
        "--header-height",
        `${totalHeight}px`,
      );
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return null;
}
