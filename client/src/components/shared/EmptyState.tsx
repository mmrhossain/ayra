import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

type EmptyStateProps = {
    title: string;
    description: string;
    icon?: ReactNode;
    actionLabel: string;
    actionHref: string;
    footerText?: string;
    className?: string;
};

const EmptyState = ({ title, description, icon, actionLabel, actionHref, footerText, className }: EmptyStateProps) => {
    return (
        <div className={cn(
            "flex min-h-[calc(100svh-var(--header-height,112px)-var(--bottom-nav-space,0px))] w-full min-w-0 items-center justify-center px-4 py-6 sm:px-6 sm:py-10",
            className,
        )}>
            <div className="w-full min-w-0 max-w-sm text-center">
                {/* Visual Icon Container */}
                <div className="relative mx-auto mb-4 size-20 shrink-0 sm:mb-5 sm:size-24">
                    <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse motion-reduce:animate-none" />
                    <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm [&>svg]:size-8 sm:[&>svg]:size-10">
                        {icon ?? <ShoppingBag className="h-10 w-10 text-primary/40" strokeWidth={1.5} />}
                    </div>
                </div>

                {/* Text Content */}
                <div className="mb-5 space-y-2 sm:mb-6 sm:space-y-3">
                    <h2 className="text-xl leading-snug font-semibold tracking-tight text-slate-900 capitalize [overflow-wrap:anywhere] sm:text-2xl">
                        {title}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-500 [overflow-wrap:anywhere] sm:px-4">
                        {description}
                    </p>
                </div>

                {/* Call to Action */}
                <Link
                    href={actionHref}
                    className="group inline-flex min-h-11 w-full max-w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 sm:w-auto sm:px-8 sm:py-4 text-sm font-medium tracking-wide uppercase text-white shadow-xl shadow-slate-200 transition-all hover:bg-primary active:scale-95"
                >
                    <span className="min-w-0 [overflow-wrap:anywhere]">{actionLabel}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Secondary Hint */}
                {footerText ? (
                    <p className="mt-4 text-xs leading-relaxed font-bold text-slate-400 uppercase tracking-wider [overflow-wrap:anywhere] sm:mt-5 sm:tracking-widest">
                        {footerText}
                    </p>
                ) : null}
            </div>
        </div>
    );
};

export default EmptyState;
