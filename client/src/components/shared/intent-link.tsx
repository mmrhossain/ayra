"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "prefetch">;

/** Prefetch a chosen destination, rather than every visible catalog link. */
export default function IntentLink({ href, onMouseEnter, onFocus, ...props }: Props) {
  const [intentHref, setIntentHref] = useState<Props["href"] | null>(null);
  const internal = typeof href === "string" ? href.startsWith("/") && !href.startsWith("//") : true;
  return (
    <Link
      {...props}
      href={href}
      prefetch={internal && intentHref === href}
      onMouseEnter={event => {
        if (!event.defaultPrevented) setIntentHref(href);
        onMouseEnter?.(event);
      }}
      onFocus={event => {
        if (!event.defaultPrevented) setIntentHref(href);
        onFocus?.(event);
      }}
    />
  );
}
