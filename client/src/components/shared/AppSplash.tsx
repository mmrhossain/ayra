"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const LETTERS = ["A", "Y", "R", "A"] as const;
const HOLD_MS = 420;
const EXIT_MS = 280;

export function AppSplash() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const total = reduceMotion
      ? 320
      : LETTERS.length * 180 + HOLD_MS + EXIT_MS;

    const timer = window.setTimeout(() => setOpen(false), total);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open, reduceMotion]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="ayra-splash"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: "easeOut" }}
          aria-hidden="true"
        >
          <p className="flex items-baseline gap-[0.08em] text-5xl font-semibold tracking-[0.18em] text-foreground sm:text-6xl">
            {LETTERS.map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                initial={
                  reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.32,
                  delay: reduceMotion ? 0 : index * 0.18,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {letter}
              </motion.span>
            ))}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
