import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

const EmptyState = ({ text, title }: { text: string; title?: string }) => {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-sm w-full text-center">
                {/* Visual Icon Container */}
                <div className="relative mx-auto w-24 h-24 mb-8">
                    <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
                    <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm">
                        <ShoppingBag className="h-10 w-10 text-primary/40" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-3 mb-10">
                    <h2 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
                        {title ?? `Your ${text} is empty`}
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">
                        Discover our curated heritage collection and fill your {text} with pieces you&apos;ll cherish forever.
                    </p>
                </div>

                {/* Call to Action */}
                <Link
                    href="/shop"
                    className="group inline-flex items-center gap-2 bg-slate-900 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-primary shadow-xl shadow-slate-200 active:scale-95 rounded-2xl"
                >
                    Continue Shopping
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Secondary Hint */}
                <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Handcrafted with heritage
                </p>
            </div>
        </div>
    );
};

export default EmptyState;