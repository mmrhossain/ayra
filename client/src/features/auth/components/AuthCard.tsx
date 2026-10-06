import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const authInputClass =
  "h-11 w-full min-w-0 rounded-md border-gray-200 py-2 pl-3 pr-11 text-base shadow-none md:text-sm";

export const authSubmitClass =
  "flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base";

export function AuthSpinner() {
  return (
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

export default function AuthCard({
  title,
  description,
  children,
  showBack = true,
  backHref = "/",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md";
  minHeight?: "default" | "tall";
  showBack?: boolean;
  backHref?: string;
}) {
  return (
    <div className="flex min-h-dvh w-full min-w-0 items-start justify-center overflow-x-hidden px-4 py-6 sm:items-center sm:px-6 sm:py-10 md:py-16">
      <div className="w-full max-w-[min(100%,26.25rem)] min-w-0 rounded-md border border-gray-100 bg-white p-4 shadow-md shadow-gray-100/50 xs:p-6 md:p-8">
        {showBack ? (
          <div className="mb-4 sm:mb-5">
            <Link
              href={backHref}
              className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-primary"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
          </div>
        ) : null}

        <div className="mb-6 text-left sm:mb-8">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-secondary">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
