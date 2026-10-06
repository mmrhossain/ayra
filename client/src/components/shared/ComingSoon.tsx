"use client";

import React from "react";
import { Construction, Home } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

const ComingSoon = () => {
    const shouldReduceMotion = useReducedMotion();

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] md:min-h-[80vh] text-center px-4">

            {/* Animated Icon */}
            <motion.div
                initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
                className="mb-4"
            >
                <Construction className="w-20 h-20 text-primary" />
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-2 text-gray-800">
                Under Development
            </h1>

            {/* Subtitle */}
            <p className="text-gray-500 text-lg max-w-md">
                We are working hard! Exciting new features are coming soon. Please stay tuned.
            </p>

            {/* Pulse dot */}
            <motion.div
                className="w-4 h-4 bg-primary rounded-full mt-6"
                animate={shouldReduceMotion ? { scale: 1 } : { scale: [1, 1.2, 1] }}
                transition={shouldReduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 1.2 }}
            />

            {/* Back to Home Button */}
            <Link
                href="/"
                className="
                    mt-8 flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full
                    shadow-md hover:bg-primary transition-all duration-300 text-lg
                "
            >
                <Home className="w-5 h-5" />
                Back to Home
            </Link>
        </div>
    );
};

export default ComingSoon;
