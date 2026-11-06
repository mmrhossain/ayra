import { CheckCircle, Headphones, RotateCw, Shield } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Feature = {
  id: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
};

export const features: Feature[] = [
    { id: 1, icon: RotateCw, title: "Easy Returns", description: "30-day hassle-free returns" },
    { id: 2, icon: Shield, title: "Secure Payment", description: "100% secure payment options" },
    { id: 3, icon: Headphones, title: "Customer Support", description: "24/7 dedicated support" },
    { id: 4, icon: CheckCircle, title: "Quality Guarantee", description: "Top-quality products guaranteed" },
];