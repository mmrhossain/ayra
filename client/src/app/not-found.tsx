"use client"

import Link from 'next/link'
import { SearchX, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
            
            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full" />

            {/* Icon Section with Glass Effect */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className="relative p-6 md:p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white shadow-2xl text-primary">
                    <SearchX size={60} strokeWidth={1.5} />
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-md space-y-4">
                <span aria-hidden="true" className="absolute top-1/2 left-1/2 -z-20 -translate-x-1/2 -translate-y-1/2 text-6xl font-semibold tracking-tight text-foreground/10 select-none md:text-8xl">
                    404
                </span>

                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    Lost in <span className="text-primary italic">Space?</span>
                </h1>
                
                <p className="text-foreground/60 text-sm md:text-base font-medium leading-relaxed">
                    {/* FIXED: Using &apos; for the apostrophe */}
                    The page you are looking for doesn&apos;t exist or has been moved. 
                    Let&apos;s get you back to the collection.
                </p>
            </div>

            {/* Action Button */}
            <div className="mt-10">
                <Link 
                    href="/"
                    className="group flex items-center gap-3 bg-slate-900 hover:bg-primary text-white py-4 px-8 rounded-full text-sm font-medium uppercase tracking-wide transition-all duration-500 shadow-xl shadow-slate-900/20 hover:shadow-primary/30"
                >
                    <Home size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                    Return Home
                </Link>
            </div>
        </div>
    )
}