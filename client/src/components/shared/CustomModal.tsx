"use client";

import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import React, { useEffect } from "react";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function CustomModal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: CustomModalProps) {
  // মডাল ওপেন হলে বডির স্ক্রোল বন্ধ করা (লেআউট শিফট ছাড়াই)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* ব্যাকগ্রাউন্ড ওভারলে এবং ব্লার */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in-0"
        onClick={onClose}
      />

      {/* মডাল কন্টেন্ট বক্স */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg duration-200 animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95",
          className,
        )}
      >
        {/* হেডার ও টাইটেল */}
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-secondary">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        )}

        {/* মডালের মূল কন্টেন্ট */}
        {children}
      </div>
    </div>
  );
}
