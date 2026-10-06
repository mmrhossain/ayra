import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

type QuantityStepperProps = {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const QuantityStepper = ({
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
  loading,
  size = "md",
  className,
}: QuantityStepperProps) => {
  const compact = size === "sm";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between rounded-sm bg-bg-primary",
        compact
          ? "h-9 min-w-[96px] px-1"
          : "h-11 min-w-[120px] px-1.5 sm:h-12 sm:min-w-[140px] md:h-[42px] md:min-w-[160px]",
        className,
      )}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={decreaseDisabled || loading}
        className={cn(
          "flex items-center justify-center rounded-full text-secondary transition-transform active:scale-90 disabled:opacity-40",
          compact ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10",
        )}
        aria-label="Decrease quantity"
      >
        <Minus size={compact ? 14 : 16} strokeWidth={2.5} />
      </button>
      <span
        className={cn(
          "min-w-[1.25rem] text-center font-semibold text-secondary",
          compact ? "text-sm" : "text-sm sm:text-base",
        )}
      >
        {loading ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
        ) : (
          value
        )}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={increaseDisabled || loading}
        className={cn(
          "flex items-center justify-center rounded-full text-secondary transition-transform active:scale-90 disabled:opacity-40",
          compact ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10",
        )}
        aria-label="Increase quantity"
      >
        <Plus size={compact ? 14 : 16} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default QuantityStepper;
