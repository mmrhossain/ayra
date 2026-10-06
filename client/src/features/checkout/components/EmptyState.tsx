import React from 'react';
import {ShoppingCart} from "lucide-react";
import Link from "next/link";

const EmptyState = () => {

    return (
        <div className="container max-w-6xl px-4 py-16 lg:px-10">
            <div className="mx-auto max-w-2xl space-y-4 border border-[#ececec] bg-white p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ShoppingCart />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">
                    Your cart is empty
                </h2>
                <p className="text-secondary">
                    Add some products to your cart before checking out.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/cart"
                        className="px-5 py-3 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition"
                    >
                        View cart
                    </Link>
                    <Link
                        href="/shop"
                        className="px-5 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-black transition"
                    >
                        Continue shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EmptyState;