import {StaticImageData} from "next/image";

export interface BannerData {
    id: number;
    category?: string;
    title?: string,
    offer?: string,
    image: StaticImageData | string,
    icon?: StaticImageData | string
    subtitle: string,
    ctaText: string;
}