import { ComponentType, SVGProps } from "react";

export interface Feature {
    id: number;
    icon: ComponentType<SVGProps<SVGSVGElement>>; // Accepts a React component
    title: string;
    description: string;
}
