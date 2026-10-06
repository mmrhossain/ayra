"use client";

import React, { Suspense } from "react";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import SearchBox from "@/components/shared/SearchBox";

const SearchDrawer = ({ onClose }: { onClose: () => void }) => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <div
            className="fixed inset-0 z-[10000] flex h-dvh items-start justify-center overflow-y-auto bg-black/40 xl:hidden"
            onClick={onClose}
        >
            <motion.div
                initial={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: -200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: -200, opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
                className="relative flex min-h-44 w-full items-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 mt-4">
                    <h2 className="text-primary font-bold text-lg text-center uppercase tracking-widest">
                        Search Products
                    </h2>

                    <div className="w-full">
                        <Suspense fallback={<div className="w-full h-12 animate-pulse bg-muted rounded-md" />}>
                            <SearchBox className="w-full" onClose={onClose} />
                        </Suspense>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SearchDrawer;
