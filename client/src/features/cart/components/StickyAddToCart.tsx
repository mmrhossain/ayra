"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/helpers";

interface StickyAddToCartProps {
    productName: string;
    price: number;
    discountPrice: number;
    discount: number;
    isOutOfStock: boolean;
    isLoading: boolean;
    onAddToCart: () => void;
    /** Ref to the main CTA section - sticky bar appears when this scrolls out of view */
    ctaRef: React.RefObject<HTMLDivElement | null>;
}

const StickyAddToCart: React.FC<StickyAddToCartProps> = ({
    productName,
    price,
    discountPrice,
    discount,
    isOutOfStock,
    isLoading,
    onAddToCart,
    ctaRef,
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const target = ctaRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Show sticky bar when the main CTA is NOT visible
                setIsVisible(!entry.isIntersecting);
            },
            { threshold: 0 }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [ctaRef]);

    if (!isVisible) return null;

    return (
        <div
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 z-30 w-full max-w-full animate-in slide-in-from-bottom-4 duration-300 lg:hidden"
        >
            <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3">
                <div className="flex items-center gap-3 max-w-lg mx-auto">
                    {/* Price info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 truncate font-medium">{productName}</p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-base font-bold text-slate-900">
                                {formatPrice(discountPrice)}
                            </span>
                            {Number(discount) > 0 && (
                                <span className="text-[11px] text-slate-400 line-through">
                                    {formatPrice(price)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CTA button */}
                    <button
                        onClick={onAddToCart}
                        disabled={isLoading || isOutOfStock}
                        className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96] shrink-0 ${isLoading || isOutOfStock
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-btn-hover"
                            }`}
                    >
                        {isLoading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <>
                                <ShoppingCart size={14} />
                                <span>{isOutOfStock ? "Sold Out" : "Add to Cart"}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StickyAddToCart;
