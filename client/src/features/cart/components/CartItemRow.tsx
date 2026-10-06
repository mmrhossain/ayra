"use client";

import QuantityStepper from "@/components/shared/quantity-stepper";
import StoreImage from "@/components/shared/store-image";
import { variantMetaFromSku } from "@/features/cart/lib/variant-meta";
import { formatPrice } from "@/helpers";
import { cn } from "@/lib/utils";
import { CartItem } from "@/types/cart";
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
        "flex items-start gap-3 py-4 sm:gap-4 sm:py-5 md:gap-5",
        className,
      )}
    >
      <Link
        href={href}
        className="relative h-[99px] w-[99px] shrink-0 overflow-hidden rounded-lg bg-bg-primary sm:h-[110px] sm:w-[110px] md:h-[124px] md:w-[124px]"
      >
        <StoreImage
          src={imageSrc(item.productImage)}
          alt={item.productName || ""}
          fill
          sizes="(max-width: 640px) 99px, 124px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="line-clamp-2 text-sm font-bold text-secondary hover:underline sm:text-base md:text-lg"
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
          <p className="mt-2 text-base font-bold text-secondary sm:text-lg md:text-xl">
            {formatPrice(unitPrice)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.productName || "item"}`}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/10 sm:h-9 sm:w-9"
          >
            <Trash2 size={16} />
          </button>
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
