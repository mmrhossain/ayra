import React from 'react';
import {ShoppingCart} from "lucide-react";
import Link from "next/link";

const EmptyState = () => {

    return (
        <div className="container max-w-6xl px-4 py-12 sm:py-16 lg:px-10">
            <div className="mx-auto max-w-2xl space-y-4 border border-border bg-white p-5 text-center sm:p-8">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ShoppingCart />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">
                    Your cart is empty
                </h2>
                <p className="text-foreground">
                    Add some products to your cart before checking out.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        href="/cart"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold transition-colors hover:bg-gray-100 sm:w-auto"
                    >
                        View cart
                    </Link>
                    <Link
                        href="/shop"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black sm:w-auto"
                    >
                        Continue shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EmptyState;