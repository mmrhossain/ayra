"use client";

import QuantityStepper from "@/components/shared/quantity-stepper";
import StoreImage from "@/components/shared/store-image";
import { variantMetaFromSku } from "@/features/cart/lib/variant-meta";
import { formatPrice } from "@/helpers";
import { cn } from "@/lib/utils";
import { CartItem } from "@/features/cart/types";
import { Trash2 } from "lucide-react";
import Link from "next/link";

function imageSrc(src?: string | null): string {
  if (
    src &&
    (src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("/"))
  ) {
    return src;
  }
  return "/images/placeholder/product_placeholder.jpg";
}

function productHref(item: CartItem): string {
  return item.productSlug ? `/product-details/${item.productSlug}` : "/shop";
}

type CartItemRowProps = {
  item: CartItem;
  loading?: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  className?: string;
};

const CartItemRow = ({
  item,
  loading,
  onIncrease,
  onDecrease,
  onRemove,
  className,
}: CartItemRowProps) => {
  const qty = Number(item.quantity);
  const unitPrice = Number(item.unitPrice ?? 0);
  const href = productHref(item);
  const meta = variantMetaFromSku(item.sku);

  return (
    <article
      className={cn(
        "flex min-w-0 items-start gap-2.5 py-4 sm:gap-4 sm:py-5 md:gap-5",
        className,
      )}
    >
      <Link
        href={href}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-bg-primary xs:h-20 xs:w-20 sm:h-[110px] sm:w-[110px] md:h-[124px] md:w-[124px]"
      >
        <StoreImage
          src={imageSrc(item.productImage)}
          alt={item.productName || ""}
          fill
          sizes="(max-width: 400px) 64px, (max-width: 640px) 80px, (max-width: 768px) 110px, 124px"
          className="object-contain"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={href}
              className="line-clamp-2 text-sm font-medium break-words text-foreground hover:underline md:text-base"
            >
              {item.productName || "Product"}
            </Link>
            {meta.size ? (
              <p className="mt-0.5 text-xs text-sky-color sm:text-sm">
                Size: {meta.size}
              </p>
            ) : null}
            {meta.color ? (
              <p className="text-xs text-sky-color sm:text-sm">
                Color: {meta.color}
              </p>
            ) : !meta.size && item.sku ? (
              <p className="mt-0.5 text-xs text-sky-color sm:text-sm">
                SKU: {item.sku}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.productName || "item"}`}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/10 sm:h-9 sm:w-9"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <p className="text-base font-semibold tabular-nums text-foreground md:text-lg">
            {formatPrice(unitPrice)}
          </p>
          <QuantityStepper
            size="sm"
            value={qty}
            loading={loading}
            onDecrease={onDecrease}
            onIncrease={onIncrease}
            decreaseDisabled={qty <= 1}
          />
        </div>
      </div>
    </article>
  );
};

export default CartItemRow;
