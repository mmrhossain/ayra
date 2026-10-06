"use client";

import React from "react";
import Link from "next/link";
import { CustomButtonProps } from "@/types/button";
import {Button} from "@/components/ui/button";




const CustomButton = ({
                          ctaText,
                          className,
                          icon,
                          path,
                          type = "button",
                          onClick,
                      }: CustomButtonProps) => {

    // If `path` exists, render as link
    if (path) {
        return (
            <Link href={path}>
                <Button
                    type="button"
                    className={`text-white bg-primary hover:bg-btn-hover flex items-center gap-2 justify-center tracking-wide transition-colors duration-300 font-normal ${className}`}
                >
                    {ctaText}
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                </Button>
            </Link>
        );
    }

    // Otherwise render as regular button
    return (
        <Button
            type={type}
            onClick={onClick}
            className={`text-white bg-primary hover:bg-btn-hover flex items-center gap-2 justify-center tracking-wide transition-colors duration-300 font-normal ${className}`}
        >
            {ctaText}
            {icon && <span className="flex-shrink-0">{icon}</span>}
        </Button>
    );
};

export default CustomButton;
