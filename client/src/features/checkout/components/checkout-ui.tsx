"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { useId, useRef, useState } from "react";

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
  options,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  options: readonly { value: string; label: string }[];
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  const expanded = open && !disabled && options.length > 0;
  return (
    <div
      className="min-w-0"
      onBlur={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={event => {
        if (event.key !== "Escape" || !expanded) return;
        event.stopPropagation();
        setOpen(false);
        trigger.current?.focus();
      }}
    >
        <button
          ref={trigger}
          type="button"
          id={`${id}-trigger`}
          disabled={disabled || options.length === 0}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-expanded={expanded}
          aria-controls={`${id}-options`}
          data-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => setOpen(current => !current)}
          className={cn(
            checkoutControlClass,
            "flex items-center justify-between gap-2 border text-left focus-visible:outline focus-visible:outline-offset-2 data-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground",
          )}
        >
          <span id={`${id}-label`} className="sr-only">{label}</span>
          <span id={`${id}-value`} className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground", expanded && "rotate-180")} />
        </button>
        <fieldset
          id={`${id}-options`}
          aria-labelledby={`${id}-label`}
          hidden={!expanded}
          className="mt-1 max-h-56 min-w-0 overflow-y-auto rounded-sm border border-border bg-white p-1"
        >
          {options.map(option => (
            <label
              key={option.value}
              className="relative flex min-h-11 cursor-pointer items-center justify-between gap-2 px-2.5 text-sm has-[:checked]:bg-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 hover:bg-muted"
            >
              <input
                type="radio"
                name={`${id}-option`}
                value={option.value}
                checked={option.value === value}
                onChange={() => {
                  onValueChange(option.value);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                onClick={() => {
                  if (option.value !== value) return;
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className="sr-only"
              />
              <span>{option.label}</span>
              {option.value === value ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
            </label>
          ))}
        </fieldset>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm leading-snug text-danger">
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
    "group inline-flex h-11 items-center justify-self-start text-foreground transition-colors hover:text-black";
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

export function CheckoutStepActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 justify-end pt-4 max-lg:sticky max-lg:bottom-[var(--bottom-nav-space)] max-lg:z-10 max-lg:bg-background max-lg:py-3", className)}>
      {children}
    </div>
  );
}
