import {MouseEventHandler, ReactNode} from 'react'

export type CustomButtonProps  = {
    ctaText: string,
    icon?: ReactNode,
    className?: string,
    path?:string,
    type?: "submit" | "reset" | "button",
    onClick?: MouseEventHandler<HTMLButtonElement>;
}