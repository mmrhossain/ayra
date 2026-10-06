"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export const ScrollToTop: React.FC = () => {
    const [show, setShow] = useState<boolean>(false);
    const shouldReduceMotion = useReducedMotion();

    const scrollToTop = (): void => {
        window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
    };

    useEffect(() => {
        const handleScroll = (): void => {
            setShow(window.scrollY > 200); // show after 200px scroll
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.button
                    key="scroll-btn"
                    initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeInOut" }}
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                    className="
            fixed right-4 md:right-6
            bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:bottom-24
            rounded-full h-11 w-11 bg-gray-800 text-white shadow-lg
            flex items-center justify-center
            z-[9998] hover:bg-gray-700
            transition-all duration-300 active:scale-95
          "
                >
                    <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
                </motion.button>
            )}
        </AnimatePresence>
    );
};
