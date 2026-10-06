import {Category} from "@/types/category";

export interface Product {
    id: number;
    vendor_id: string;
    category_id: string;
    brand?: string;
    remarks?: string;
    rating?: number | string;
    name: string;
    slug: string;
    sku: string;
    description: string | null;
    price: string | null;
    discount: string | null;
    stock: string;
    sizes: string;
    colors: string;
    weight: string;
    status: string;
    images: ProductImage[];
    category?: Category;
    vendor?: Vendor;
    stocks?: ProductStock[];
}

export interface Vendor {
    id: number;
    user_id: string;
    shop_name: string;
    shop_slug: string;
    description: string;
    logo: string;
    cover_image: string;
    address: string | null;
    city: string | null;
    country: string | null;
    status: string;
}

export interface ProductImage {
    id?: number;
    product_id?: string;
    imageUrl: string;
}

export interface ProductStock {
    id: number;
    product_id: number;
    batch_code: string;
    quantity: number;
    price: string;
    purchased_at: Date;
    expire_at: Date;
}