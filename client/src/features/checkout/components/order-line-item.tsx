"use client";

import StoreImage from "@/components/shared/store-image";
import { formatPrice } from "@/helpers";
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

type OrderLineItemProps = {
  name: string;
  image?: string | null;
  variantLabel?: string;
  quantity: number;
  price: number;
  changeHref?: string;
};

export default function OrderLineItem({
  name,
  image,
  variantLabel,
  quantity,
  price,
  changeHref = "/cart",
}: OrderLineItemProps) {
  return (
    <article className="flex gap-3 py-4 sm:gap-4 sm:py-5">
      <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden border border-[#eee] bg-neutral-50 sm:h-[80px] sm:w-[80px] xl:h-[88px] xl:w-[88px]">
        <StoreImage
          src={imageSrc(image)}
          alt={name}
          fill
          sizes="(max-width: 640px) 68px, 88px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-secondary">
            {name}
          </h3>
          <Link
            href={changeHref}
            className="shrink-0 text-xs text-neutral-400 underline underline-offset-2 transition-colors hover:text-secondary"
          >
            Change
          </Link>
        </div>
        {variantLabel ? (
          <p className="mt-0.5 text-xs text-neutral-400">{variantLabel}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-xs text-neutral-400">({quantity})</span>
          <span className="text-sm text-secondary">{formatPrice(price)}</span>
        </div>
      </div>
    </article>
  );
}
