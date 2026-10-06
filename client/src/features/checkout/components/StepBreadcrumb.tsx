"use client";

import { cn } from "@/lib/utils";

export type CheckoutStep = "information" | "shipping" | "payment";

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "information", label: "Information" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
];

type StepBreadcrumbProps = {
  current: CheckoutStep;
  onSelect?: (step: CheckoutStep) => void;
};

export const StepBreadcrumb = ({ current, onSelect }: StepBreadcrumbProps) => {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Checkout steps" className="mt-4 sm:mt-5">
      <ol className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-7">
        {STEPS.map((step, index) => {
          const isCurrent = step.id === current;
          const isComplete = index < currentIndex;
          const canJump = isComplete && Boolean(onSelect);

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!canJump}
                onClick={() => onSelect?.(step.id)}
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors sm:text-xs sm:tracking-[0.18em]",
                  isCurrent && "text-secondary",
                  isComplete && "cursor-pointer text-neutral-400 hover:text-secondary",
                  !isCurrent && !isComplete && "cursor-default text-neutral-300",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
