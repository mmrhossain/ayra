"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ScrollToTopOnNavigation = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }, [pathname, searchParams]); // triggers on route + query change

    return null;
};

export default ScrollToTopOnNavigation;
