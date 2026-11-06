"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

export const checkoutControlClass =
  "h-11 w-full min-w-0 rounded-[3px] border-border bg-white px-3.5 text-base shadow-none placeholder:text-muted-foreground focus-visible:border-neutral-500 focus-visible:ring-0 sm:h-12";

export function CheckoutSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3 sm:space-y-3.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground sm:tracking-[0.16em]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CheckoutField({
  label,
  error,
  className,
  ...props
}: ComponentProps<typeof Input> & {
  label: string;
  error?: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={props.id} className="sr-only">
        {label}
      </label>
      <Input
        aria-invalid={Boolean(error)}
        aria-describedby={error && props.id ? `${props.id}-error` : undefined}
        className={cn(checkoutControlClass, className)}
        {...props}
      />
      {error ? (
        <p
          id={props.id ? `${props.id}-error` : undefined}
          role="alert"
          className="mt-1.5 text-sm leading-snug text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutSelect({
  label,
  placeholder,
  value,
  onValueChange,
  disabled,
  error,
  children,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label={label}
          aria-invalid={Boolean(error)}
          className={cn(
            checkoutControlClass,
            "w-full max-w-full justify-between data-[size=default]:h-11 sm:data-[size=default]:h-12",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-sm border border-border bg-white">
          {children}
        </SelectContent>
      </Select>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm leading-snug text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutCta({
  children,
  loading,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  const { disabled, ...rest } = props;
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 min-h-11 w-full min-w-[132px] cursor-pointer items-center justify-center gap-3 bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-auto sm:min-w-[148px] sm:px-6",
        className,
      )}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? "Processing..." : children}
      {loading ? null : <ArrowRight size={16} strokeWidth={1.75} />}
    </button>
  );
}

export function CheckoutBack({
  href,
  onClick,
}: {
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "group mb-7 inline-flex items-center text-foreground transition-colors hover:text-black sm:mb-9";
  const inner = (
    <>
      <ArrowLeft size={18} strokeWidth={1.75} />
      <span className="ml-1 h-px w-9 bg-current transition-all duration-200 group-hover:w-12" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label="Go back">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label="Go back">
      {inner}
    </button>
  );
}

export function CheckoutSummaryRow({
  label,
  value,
  muted,
  emphasize,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-1.5 text-sm",
        emphasize && "pt-3 font-semibold",
      )}
    >
      <span
        className={cn(
          emphasize ? "text-foreground" : "font-medium text-foreground",
          muted && "font-normal text-neutral-400",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-right text-foreground",
          muted && "text-xs font-normal italic text-neutral-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function CheckoutStepActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end pt-6 max-lg:sticky max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] max-lg:z-10 max-lg:bg-background max-lg:py-3 sm:pt-8">
      {children}
    </div>
  );
}
