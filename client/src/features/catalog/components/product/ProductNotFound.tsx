"use client";

import React from 'react';
import { SearchX, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const ProductNotFound = ({ slug }: { slug?: string }) => {
    const router = useRouter();

    return (
        <div className="mt-14 flex flex-col justify-center items-center text-center h-[60vh] px-4">
            {/* Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                <SearchX className="h-10 w-10 text-red-400" />
            </div>

            {/* Text */}
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
                No products found
            </h2>

            <p className="mt-2 max-w-sm text-base text-gray-500">
                {slug ? (
                    <>
                        We couldn’t find anything matching{" "}
                        <span className="font-semibold text-gray-900">“{slug}”</span>.
                    </>
                ) : (
                    "We couldn't find any products in this category yet."
                )}
                {" "}Try a different keyword or check your spelling.
            </p>

            {/* Action Buttons (The manual "Undo") */}
            <div className="mt-8 flex gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Go Back
                </button>

                <button
                    onClick={() => router.push('/shop')}
                    className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 transition-opacity"
                >
                    Browse All Products
                </button>
            </div>
        </div>
    );
};

export default ProductNotFound;