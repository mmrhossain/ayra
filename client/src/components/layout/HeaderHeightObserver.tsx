"use client";

import { useEffect } from "react";

export default function HeaderHeightObserver() {
  useEffect(() => {
    const header = document.querySelector("header");
    const navbar = document.querySelector("nav");
    let previousTotal = -1;
    let previousNavbar = -1;
    const updateHeight = () => {
      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      const totalHeight = (header ? header.offsetHeight : 0) + navbarHeight;
      if (totalHeight !== previousTotal) {
        document.documentElement.style.setProperty("--header-height", totalHeight + "px");
        previousTotal = totalHeight;
      }
      if (navbarHeight !== previousNavbar) {
        document.documentElement.style.setProperty("--navbar-height", navbarHeight + "px");
        previousNavbar = navbarHeight;
      }
    };
    const observer = new ResizeObserver(updateHeight);
    if (header) observer.observe(header);
    if (navbar) observer.observe(navbar);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);
  return null;
}
