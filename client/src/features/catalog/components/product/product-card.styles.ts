import { cva } from "class-variance-authority";

export const productCardShell = "group relative flex h-full flex-col bg-white";

export const productCardMedia = "relative aspect-[4/5] overflow-hidden bg-slate-50";

export const productCardImage =
  "object-cover transition-transform duration-700 group-hover:scale-105";

export const productCardBody = "flex flex-grow flex-col space-y-1.5 pt-3 sm:space-y-2 sm:pt-4";

export const productCardTitle =
  "line-clamp-2 min-w-0 text-xsm font-medium leading-snug text-slate-800 transition-colors group-hover:text-primary md:text-base";

export const productCardPrice = "text-base font-semibold tabular-nums text-slate-900 md:text-lg";

export const productCardCompare = "text-xs font-medium tabular-nums text-slate-400 line-through";

export const productCardPricePlain =
  "text-base font-semibold tabular-nums text-slate-900 md:text-lg";

export const productCardBadge = cva(
  "rounded-full px-2 py-1 text-xs font-bold tracking-wider uppercase sm:px-3",
  {
    variants: {
      tone: {
        sale: "bg-primary text-white shadow-lg",
        soldOut: "bg-slate-900/90 backdrop-blur-md text-white",
      },
    },
    defaultVariants: {
      tone: "sale",
    },
  }
);

export const productCardIconBtn = cva(
  "rounded-full p-2.5 shadow-xl transition-all duration-300 active:scale-95 sm:p-3",
  {
    variants: {
      tone: {
        default: "bg-white text-dark-color hover:bg-primary hover:text-white",
        active: "bg-primary text-white",
        dark: "bg-white text-dark-color hover:bg-slate-900 hover:text-white",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
);

export const productCardCta = cva(
  "flex h-11 w-full items-center justify-center gap-2 text-sm font-medium tracking-wider uppercase transition-all duration-300 active:scale-[0.98] sm:h-12",
  {
    variants: {
      state: {
        default: "bg-slate-900 text-white hover:bg-primary hover:shadow-xl hover:shadow-primary/30",
        disabled: "cursor-not-allowed bg-slate-100 text-slate-400",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export const seeMoreButtonClass =
  "group h-11 rounded-full border-2 border-slate-900 bg-white px-6 text-xs font-semibold tracking-wider uppercase text-slate-900 shadow-xl transition-all duration-300 hover:bg-slate-900 hover:text-white hover:shadow-slate-900/20 sm:h-14 sm:px-10";
