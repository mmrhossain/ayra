"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const themeMap: Record<string, string> = {
    "/": "#fff",          // Home
    // "/products": "#ffffff",
    // "/cart": "#111827",
    // "/checkout": "#000000",
};

export default function ThemeColorManager() {
    const pathname = usePathname();

    useEffect(() => {
        const color = themeMap[pathname] || "#fff";

        const meta = document.querySelector("meta[name='theme-color']");

        if (meta) {
            meta.setAttribute("content", color);
        } else {
            const newMeta = document.createElement("meta");
            newMeta.name = "theme-color";
            newMeta.content = color;
            document.head.appendChild(newMeta);
        }
    }, [pathname]);

    return null;
}