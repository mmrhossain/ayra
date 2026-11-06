"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type CustomButtonProps = {
  ctaText: string;
  icon?: ReactNode;
  className?: string;
  path?: string;
  type?: "submit" | "reset" | "button";
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

const CustomButton = ({
  ctaText,
  className,
  icon,
  path,
  type = "button",
  onClick,
}: CustomButtonProps) => {

    const buttonClassName = `flex items-center justify-center gap-2 font-normal tracking-wide transition-colors duration-300 ${className ?? ""}`;

    // If `path` exists, render as a single link styled as a button.
    if (path) {
        return (
            <Button asChild variant="brand" className={buttonClassName}>
                <Link href={path}>
                    {ctaText}
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                </Link>
            </Button>
        );
    }

    // Otherwise render as regular button
    return (
        <Button
            type={type}
            variant="brand"
            onClick={onClick}
            className={buttonClassName}
        >
            {ctaText}
            {icon && <span className="flex-shrink-0">{icon}</span>}
        </Button>
    );
};

export default CustomButton;
